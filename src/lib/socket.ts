import { io } from "socket.io-client";

// Use relative path for Replit proxy support
const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5005" 
  : "/";

export const socket = io(BACKEND_URL, {
  path: "/socket.io",
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("Connected to IoT Backend via WebSocket");
});

socket.on("disconnect", () => {
  console.log("Disconnected from IoT Backend");
});
