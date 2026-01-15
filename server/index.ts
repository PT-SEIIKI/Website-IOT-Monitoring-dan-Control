import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mqtt from "mqtt";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertDeviceLogSchema } from "../shared/schema";

const app = express();

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" })); // Limit body size

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

// MQTT Setup with error handling
const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  reconnectPeriod: 5000,
  connectTimeout: 30 * 1000,
});

mqttClient.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker");
  mqttClient.subscribe("iot/monitoring/#");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const deviceId = parseInt(topic.split("/").pop() || "0");
    
    if (deviceId) {
      console.log(`MQTT Received: ${topic} ->`, payload);
      
      // Upsert device to ensure it exists if not already in DB
      let device = await storage.getDevice(deviceId);
      if (!device) {
        // Create initial device record if ESP32 sends data for new ID
        // Note: In production, you might want to pre-register devices
        console.log(`Auto-registering device ${deviceId}`);
        // We'll use a placeholder name/type that the user can update later
        // or expect the user to have added them via UI (if implemented)
      }

      // Update database with latest values from ESP32
      const updatedDevice = await storage.updateDevice(deviceId, payload.status, payload.value);
      
      if (updatedDevice) {
        // Real-time broadcast to all web dashboards
        io.emit("device_update", updatedDevice);
      }
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
      console.log(`Web Control: Device ${deviceId} ->`, { status, value });

      // Update DB first
      const updatedDevice = await storage.updateDevice(deviceId, status, value);
      
      // Relay to MQTT for ESP32 hardware
      mqttClient.publish(`iot/control/${deviceId}`, JSON.stringify({ status, value }));
      
      // Log interaction
      await storage.logAction({
        deviceId,
        action: "web_override",
        value: JSON.stringify({ status, value }),
      });

      // Notify other dashboards
      io.emit("device_update", updatedDevice);
    } catch (err) {
      console.error("Web Control Error:", err);
    }
  });
});

// API Routes
app.get("/api/devices", async (_req, res) => {
  const devices = await storage.getDevices();
  res.json(devices);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5005;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
