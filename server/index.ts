import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mqtt from "mqtt";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";

const app = express();

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", limiter);

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
const mqttClient = mqtt.connect("mqtt://154.19.37.61:1883", {
  reconnectPeriod: 5000,
  connectTimeout: 30 * 1000,
});

// ESP32 Device ID
const ESP32_DEVICE_ID = "power-monitor-001";

mqttClient.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

mqttClient.on("connect", () => {
  console.log("Connected to Remote MQTT Broker (154.19.37.61)");
  // Subscribe to all monitoring topics
  mqttClient.subscribe(`iot/monitoring/${ESP32_DEVICE_ID}/#`);
});

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    
    // Example topic: iot/monitoring/power-monitor-001/relay
    // The ESP32 code uses: topicBase + "/" + type
    const topicParts = topic.split("/");
    const type = topicParts[topicParts.length - 1];

    if (type === "relay" && payload.status) {
      const relayNum = payload.value; // Relay number 1-6
      const status = payload.status === "on";
      
      // Relays 1-5 are lamps, Relay 6 is AC
      if (relayNum === 6) {
        const updatedDevice = await storage.updateDevice(relayNum, status, payload.wattage || 0);
        if (updatedDevice) {
          io.emit("device_update", { ...updatedDevice, isAC: true });
        }
      } else {
        const updatedDevice = await storage.updateDevice(relayNum, status, payload.wattage || 0);
        if (updatedDevice) {
          io.emit("device_update", updatedDevice);
        }
      }
    }

    if (type === "status" && payload.message) {
      console.log("ESP32 Status:", payload.message);
    }
    
    // Handle power data if any
    if (type === "power") {
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
      
      // ✅ FIX: Publish ke topic yang BENAR dengan payload yang BENAR
      const controlTopic = `iot/monitoring/${ESP32_DEVICE_ID}/control`;
      const controlPayload = {
        relay: deviceId,           // Relay number (1-6)
        action: status ? "on" : "off",  // "on" atau "off"
        value: value || 0
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
app.get("/api/devices", async (_req, res) => {
  const devices = await storage.getDevices();
  res.json(devices);
});

// API endpoint untuk kontrol device
app.post("/api/devices/:id/control", async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const { status, value } = req.body;
    
    // Update database
    const updatedDevice = await storage.updateDevice(deviceId, status, value);
    
    // Publish to MQTT
    const controlTopic = `iot/monitoring/${ESP32_DEVICE_ID}/control`;
    const controlPayload = {
      relay: deviceId,
      action: status ? "on" : "off",
      value: value || 0
    };
    
    mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
    
    res.json({ success: true, device: updatedDevice });
  } catch (err) {
    console.error("API Control Error:", err);
    res.status(500).json({ error: "Failed to control device" });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});