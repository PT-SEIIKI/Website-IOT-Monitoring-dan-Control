import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mqtt from "mqtt";
import cors from "cors";
import { storage } from "./storage";
import { insertDeviceLogSchema } from "../shared/schema";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

// MQTT Setup
// Using a public broker for demonstration. Replace with your actual broker.
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker");
  mqttClient.subscribe("iot/monitoring/#");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const deviceId = parseInt(topic.split("/").pop() || "0");
    
    if (deviceId) {
      // payload: { status: boolean, value?: number }
      const updatedDevice = await storage.updateDevice(deviceId, payload.status, payload.value);
      
      await storage.logAction({
        deviceId,
        action: "mqtt_update",
        value: JSON.stringify(payload),
      });
      
      // Broadcast to all connected web clients via WebSocket
      io.emit("device_update", updatedDevice);
      console.log(`Device ${deviceId} updated via MQTT:`, payload);
    }
  } catch (err) {
    console.error("MQTT message error:", err);
  }
});

// Socket.io for Real-time Control from Frontend
io.on("connection", (socket) => {
  console.log("Web client connected via WebSocket");

  socket.on("control_device", async (data) => {
    // data: { deviceId, status, value }
    try {
      const { deviceId, status, value } = data;
      const updatedDevice = await storage.updateDevice(deviceId, status, value);
      
      // Publish to MQTT for ESP32 to receive
      // ESP32 should subscribe to `iot/control/${deviceId}`
      mqttClient.publish(`iot/control/${deviceId}`, JSON.stringify({ status, value }));
      
      // Log action to PostgreSQL
      await storage.logAction({
        deviceId,
        action: "web_control",
        value: JSON.stringify({ status, value }),
      });

      // Broadcast update back to all web clients
      io.emit("device_update", updatedDevice);
    } catch (err) {
      console.error("Control error:", err);
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
