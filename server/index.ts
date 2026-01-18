import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mqtt from "mqtt";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { db } from "./db";
import { deviceLogs } from "../shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Security Middleware
app.set('trust proxy', true);
app.use(helmet());
app.use(cors({
  origin: ["https://iot.seyiki.com", "http://localhost:5001"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes"
});
// app.use("/api/", limiter);

const allowedOrigins = process.env.REPLIT_DEV_DOMAIN 
  ? [`https://${process.env.REPLIT_DEV_DOMAIN}`, `https://${process.env.REPL_ID}.id.repl.co`]
  : ["*"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  allowEIO3: false,
  transports: ['websocket', 'polling']
});

// MQTT Setup
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || "mqtt://localhost:1883", {
  reconnectPeriod: 5000,
  connectTimeout: 30 * 1000,
});

// ESP32 Device ID
const ESP32_DEVICE_ID = "power-monitor-001";

mqttClient.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker:", process.env.MQTT_BROKER_URL || "mqtt://localhost:1883");
  // Subscribe to all monitoring topics
  mqttClient.subscribe(`iot/monitoring/${ESP32_DEVICE_ID}/#`);
  console.log(`Subscribed to: iot/monitoring/${ESP32_DEVICE_ID}/#`);
});

mqttClient.on("message", async (topic, message) => {
  console.log(`MQTT Message Received - Topic: ${topic}, Message: ${message.toString()}`);
  
  try {
    const payload = JSON.parse(message.toString());
    
    // Example topic: iot/monitoring/power-monitor-001/relay
    // The ESP32 code uses: topicBase + "/" + type
    const topicParts = topic.split("/");
    const lastPart = topicParts[topicParts.length - 1];
    const secondLastPart = topicParts[topicParts.length - 2];

    if (lastPart === "system") {
      // payload: {"type":"system","status":"online","deviceId":"power-monitor-001","uptime":1525,"wifiRssi":-77}
      console.log(`MQTT System Update:`, payload);
      io.emit("system_update", payload);
    }

    if (lastPart === "summary") {
      // payload: {"type":"summary","lamps_on":5,"lamps_total":5,"power_total":17.1,...}
      io.emit("summary_update", payload);
    }

    if (lastPart === "master") {
      // payload: {"type":"master","status":"on","value":1}
      console.log(`MQTT Update: Master status ->`, payload.status);
      
      // Log master action
      await storage.logAction({
        deviceId: 0, // 0 for master
        action: payload.status === "on" ? "turn_on" : "turn_off",
        value: JSON.stringify(payload),
        timestamp: new Date()
      });

      io.emit("master_update", payload);
    }

    if (secondLastPart === "lamp") {
      // Handle individual lamp updates: lamp/1, lamp/2, etc.
      // payload: {"type":"lamp_1","id":1,"status":"on","value":3.6,"power":3.6,"kwh":0.000428,"master_override":true,"web_override":false}
      try {
        const lampId = parseInt(lastPart);
        const status = payload.status === "on";
        const power = payload.power || payload.value || 0;
        const kwh = payload.kwh;
        
        console.log(`MQTT Update: Lamp ${lampId} ->`, { status, power, kwh });
        const updatedDevice = await storage.updateDevice(lampId, status, power, kwh);
        
        // Log individual lamp action from MQTT
        await storage.logAction({
          deviceId: lampId,
          action: status ? "turn_on" : "turn_off",
          value: JSON.stringify(payload),
          timestamp: new Date()
        });

        if (updatedDevice) {
          console.log(`Socket Emit: device_update for lamp ${lampId}`);
          io.emit("device_update", updatedDevice);
        }
      } catch (err) {
        console.error("Error processing lamp update:", err);
      }
    }

    if (lastPart === "relay" && payload.relay) {
      const relayNum = payload.relay; // Relay number 1-6
      const status = payload.action === "on";
      const power = payload.wattage || 0;
      const kwh = payload.kwh;
      
      console.log(`MQTT Relay Update: Relay ${relayNum} -> ${payload.action}`);
      
      // All relays are lamps now
      const updatedDevice = await storage.updateDevice(relayNum, status, power, kwh);
      
      // Log relay action
      await storage.logAction({
        deviceId: relayNum,
        action: status ? "turn_on" : "turn_off",
        value: JSON.stringify(payload),
      });

      if (updatedDevice) {
        io.emit("device_update", updatedDevice);
      }
    }

    if (payload.type === "relay_energy") {
      // payload: {"type":"relay_energy","relay_id":1,"kwh":0.000106,"timestamp":120046}
      console.log(`MQTT Energy Update: Relay ${payload.relay_id} -> ${payload.kwh} kWh`);
      
      // Update device in DB with latest kWh
      const updatedDevice = await storage.updateDevice(payload.relay_id, undefined as any, undefined, payload.kwh);

      // Save to daily_energy table for reporting
      const tariffSetting = await storage.getSetting('electricity_tariff');
      const ELECTRICITY_TARIFF = tariffSetting ? parseFloat(tariffSetting) : 1500;
      
      await storage.saveDailyEnergy({
        deviceId: payload.relay_id,
        kwh: payload.kwh,
        cost: payload.kwh * ELECTRICITY_TARIFF,
        date: new Date()
      });

      // Get all devices to calculate total energy
      const devices = await storage.getDevices();
      const energyToday = devices.reduce((sum: any, d: any) => sum + (d.kwh || 0), 0);
      const powerTotal = devices.reduce((sum: any, d: any) => sum + (d.status ? (d.value || 0) : 0), 0);
      const lampsOn = devices.filter(d => d.status).length;
      const costToday = energyToday * ELECTRICITY_TARIFF;

      io.emit("summary_update", {
        type: "summary",
        energy_today: energyToday,
        cost_today: costToday,
        power_total: powerTotal,
        lamps_on: lampsOn
      });

      io.emit("energy_update", payload);
    }

    if (lastPart === "status" && payload.message) {
      console.log("ESP32 Status:", payload.message);
    }
    
    // Handle power data if any
    if (lastPart === "power") {
      io.emit("power_update", payload);
    }

  } catch (err) {
    console.error("MQTT Processing Error:", err);
  }
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  socket.on("control_device", async (data) => {
    try {
      const { deviceId, status, value } = data;
      console.log(`Web Control: Lamp ${deviceId} ->`, { status, value });

      // Update DB first
      const updatedDevice = await storage.updateDevice(deviceId, status, value);
      
      // ✅ Updated to correct control topic format
      const controlTopic = `iot/control/${ESP32_DEVICE_ID}/lamp/${deviceId}`;
      const controlPayload = {
        command: "set_status",
        status: status ? "on" : "off",
        web_override: true
      };
      
      console.log(`Publishing to ${controlTopic}:`, controlPayload);
      mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
      
      // Log interaction
      await storage.logAction({
        deviceId,
        action: status ? "turn_on" : "turn_off",
        value: JSON.stringify({ status, value }),
      });

      // Notify other dashboards
      io.emit("device_update", updatedDevice);
      
      socket.emit("control_success", { deviceId, status });
      
    } catch (err) {
      console.error("Web Control Error:", err);
      socket.emit("control_error", { error: "Failed to control device" });
    }
  });
  
  // Handle control ALL lamps
  socket.on("control_all", async (data) => {
    try {
      const { status } = data; // true = ON, false = OFF
      console.log(`Web Control ALL lamps ->`, status ? "ON" : "OFF");
      
      const controlTopic = `iot/monitoring/${ESP32_DEVICE_ID}/control`;
      const controlPayload = {
        command: "all",
        action: status ? "on" : "off"
      };
      
      console.log(`Publishing to ${controlTopic}:`, controlPayload);
      mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
      
      socket.emit("control_success", { all: true, status });
      
    } catch (err) {
      console.error("Control All Error:", err);
      socket.emit("control_error", { error: "Failed to control all devices" });
    }
  });
});

// API Routes
app.get("/api/logs", async (_req, res) => {
  try {
    const logs = await storage.getLogs();
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.get("/api/devices", async (_req, res) => {
  const devices = await storage.getDevices();
  res.json(devices);
});

app.get("/api/settings/:key", async (req, res) => {
  const value = await storage.getSetting(req.params.key);
  res.json({ key: req.params.key, value });
});

app.post("/api/settings", async (req, res) => {
  const { key, value } = req.body;
  await storage.updateSetting(key, value);
  res.json({ success: true });
});

app.get("/api/schedules", async (_req, res) => {
  const schedules = await storage.getSchedules();
  res.json(schedules);
});

app.post("/api/schedules", async (req, res) => {
  const schedule = await storage.createSchedule(req.body);
  res.json(schedule);
});

app.patch("/api/schedules/:id", async (req, res) => {
  const schedule = await storage.updateSchedule(parseInt(req.params.id), req.body);
  res.json(schedule);
});

app.delete("/api/schedules/:id", async (req, res) => {
  await storage.deleteSchedule(parseInt(req.params.id));
  res.json({ success: true });
});

app.get("/api/installations", async (_req, res) => {
  const allInstallations = await storage.getInstallations();
  res.json(allInstallations);
});

app.post("/api/installations", async (req, res) => {
  const installation = await storage.createInstallation(req.body);
  res.json(installation);
});

app.patch("/api/installations/:id", async (req, res) => {
  const installation = await storage.updateInstallation(parseInt(req.params.id), req.body);
  res.json(installation);
});

app.delete("/api/installations/:id", async (req, res) => {
  await storage.deleteInstallation(parseInt(req.params.id));
  res.json({ success: true });
});

// API endpoint untuk kontrol device
app.post("/api/devices/:id/control", async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const { status, value } = req.body;
    
    console.log(`🎯 API Control Request: Device ${deviceId} ->`, { status, value });
    
    // Update database
    const updatedDevice = await storage.updateDevice(deviceId, status, value);
    
    // Publish to MQTT
    const controlTopic = `iot/control/${ESP32_DEVICE_ID}/lamp/${deviceId}`;
    const controlPayload = {
      command: "set_status",
      status: status ? "on" : "off",
      web_override: true
    };
    
    console.log(`📤 Publishing to MQTT: ${controlTopic}:`, controlPayload);
    mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
    console.log(`✅ MQTT Published successfully for device ${deviceId}`);
    
    res.json({ success: true, device: updatedDevice });
  } catch (err) {
    console.error("❌ API Control Error:", err);
    res.status(500).json({ error: "Failed to control device" });
  }
});

app.get("/api/energy-history", async (_req, res) => {
  try {
    const history = await storage.getDailyEnergy();
    res.json(history);
  } catch (err) {
    console.error("Error fetching energy history:", err);
    res.status(500).json({ error: "Failed to fetch energy history" });
  }
});

// Automation Schedule Checker
const checkSchedules = async () => {
  try {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const currentDay = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];

    console.log(`🕒 Checking schedules for ${currentDay} ${currentTime}`);

    const schedules = await storage.getSchedules();
    const activeSchedules = schedules.filter(s => {
      const days = JSON.parse(s.daysOfWeek);
      return s.isActive && s.time === currentTime && days.includes(currentDay);
    });

    for (const schedule of activeSchedules) {
      console.log(`🚀 Executing schedule: ${schedule.roomName} - ${schedule.deviceType} -> ${schedule.action}`);
      
      let controlTopic = "";
      let controlPayload = {};

      if (schedule.deviceType === "lamp") {
        controlTopic = `iot/monitoring/${ESP32_DEVICE_ID}/control`;
        controlPayload = {
          command: "all",
          action: schedule.action === "turn_on" ? "on" : "off"
        };
      } else if (schedule.deviceType.startsWith("lamp_")) {
        const lampId = schedule.deviceType.split("_")[1];
        controlTopic = `iot/control/${ESP32_DEVICE_ID}/lamp/${lampId}`;
        controlPayload = {
          command: "set_status",
          status: schedule.action === "turn_on" ? "on" : "off",
          web_override: true
        };
      }

      if (controlTopic) {
        mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
        
        // Update DB status
        if (schedule.deviceType.startsWith("lamp_")) {
          const lampId = parseInt(schedule.deviceType.split("_")[1]);
          await storage.updateDevice(lampId, schedule.action === "turn_on", 0);
        }
        
        io.emit("schedule_executed", {
          id: schedule.id,
          message: `${schedule.deviceType} di ${schedule.roomName} telah ${schedule.action === 'turn_on' ? 'dinyalakan' : 'dimatikan'} otomatis`
        });
      }
    }
  } catch (err) {
    console.error("Schedule Checker Error:", err);
  }
};

setInterval(checkSchedules, 60000); // Check every minute

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});