import { io } from "socket.io-client";

// Use relative path for Replit proxy support
const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5001"  // Use Vite dev server port with proxy
  : "/";

export const socket = io(BACKEND_URL, {
  path: "/socket.io",
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("✅ Connected to IoT Backend via WebSocket on:", BACKEND_URL);
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
