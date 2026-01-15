import { io } from "socket.io-client";

// Socket.io configuration with fallback transports
const BACKEND_URL = "http://154.19.37.61:5002";

const socket = io(BACKEND_URL, {
  path: "/socket.io/",
  transports: ["websocket"], // paksa hanya websocket
  secure: true,
  rejectUnauthorized: false, // jika sertifikat self-signed
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
