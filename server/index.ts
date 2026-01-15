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
const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  reconnectPeriod: 5000,
  connectTimeout: 30 * 1000,
});

// ESP32 Device ID (sesuaikan dengan device Anda)
const ESP32_DEVICE_ID = "power-monitor-001";

mqttClient.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker");
  // Subscribe to all monitoring topics
  mqttClient.subscribe("iot/monitoring/#");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`MQTT Received: ${topic} ->`, payload);
    
    // Extract lamp ID from topic: iot/monitoring/power-monitor-001/lamp/1
    const topicParts = topic.split("/");
    
    if (topicParts[3] === "lamp" && topicParts[4]) {
      const lampId = parseInt(topicParts[4]);
      
      if (lampId && payload) {
        // Update database with latest lamp status
        const status = payload.status === "on";
        const value = payload.value || 0;
        
        const updatedDevice = await storage.updateDevice(lampId, status, value);
        
        if (updatedDevice) {
          // Real-time broadcast to all web dashboards
          io.emit("device_update", updatedDevice);
        }
      }
    }
    
    // Handle other topics (summary, system, etc.)
    if (topicParts[3] === "summary") {
      io.emit("summary_update", payload);
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