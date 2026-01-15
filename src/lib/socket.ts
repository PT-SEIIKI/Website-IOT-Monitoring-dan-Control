import { io } from "socket.io-client";

// Use direct connection for production
const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5001"  // Development
  : "https://iot.seyiki.com"; // Production

export const socket = io(BACKEND_URL, {
  path: "/socket.io",
  transports: ['polling'], // Use polling instead of WebSocket for now
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("✅ Connected to IoT Backend via:", BACKEND_URL);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from IoT Backend");
});

socket.on("connect_error", (error) => {
  console.log("❌ Socket connection error:", error.message);
  console.log("🔧 Trying to connect to:", BACKEND_URL);
});

socket.on("control_success", (data) => {
  console.log("🎯 Control successful:", data);
});

socket.on("control_error", (data) => {
  console.log("❌ Control error:", data);
});
