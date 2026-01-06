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
      console.log(`MQTT Received: ${topic} ->`, payload);
      
      // Update database with latest values from ESP32
      const updatedDevice = await storage.updateDevice(deviceId, payload.status, payload.value);
      
      // Log the action for history tracking
      await storage.logAction({
        deviceId,
        action: "mqtt_sync",
        value: JSON.stringify(payload),
      });
      
      // Real-time broadcast to all web dashboards
      io.emit("device_update", updatedDevice);
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
