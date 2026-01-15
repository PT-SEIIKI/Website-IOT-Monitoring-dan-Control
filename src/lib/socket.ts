import { io } from "socket.io-client";

// Get the domain from environment or use a default for development
// In Replit, we use the public URL of the backend
const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5005" 
  : `https://${window.location.hostname}`; // Simplified for VPS/Production

export const socket = io(BACKEND_URL, {
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
