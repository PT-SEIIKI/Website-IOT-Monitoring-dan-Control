import { io } from "socket.io-client";

// Socket.io configuration with fallback transports
const BACKEND_URL = window.location.origin;

export const socket = io(BACKEND_URL, {
  path: "/socket.io/",
  transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
  reconnectionAttempts: 5,
  timeout: 10000,
  forceNew: true,
  autoConnect: true
});

// Enhanced logging
socket.on("connect", () => {
  console.log("✅ Connected to backend server");
  console.log("Socket ID:", socket.id);
  console.log("Transport:", socket.io.engine.transport.name);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection failed:", error.message);
  console.error("Transport used:", socket.io.engine.transport.name);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🔄 Reconnected after", attemptNumber, "attempts");
});

// Log all events for debugging
socket.onAny((eventName, ...args) => {
  console.log("📨 Socket Event:", eventName, args);
});

// MQTT Message handling
socket.on("mqtt_message", (data) => {
  console.log("📡 MQTT Message Received:", data);
  
  // Emit custom events for different message types
  if (data.type && data.type.startsWith('lamp_')) {
    socket.emit('lamp_update', data);
  }
  
  if (data.type && data.type === 'master_status') {
    socket.emit('master_update', data);
  }
});

// Master status update
socket.on("master_status", (data) => {
  console.log("🎛️ Master Status Update:", data);
});

// Individual lamp update
socket.on("lamp_update", (data) => {
  console.log("💡 Lamp Update:", data);
});
