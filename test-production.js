#!/usr/bin/env node

// Test connection to production server
import { io } from "socket.io-client";

console.log('🔍 Testing Production Server Connection...');

// Test connection to production server
const socket = io('https://iot.seyiki.com', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 3,
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ Connected to production server!');
  console.log('Socket ID:', socket.id);
  
  // Test control command
  console.log('🎯 Sending test control command...');
  socket.emit('control_device', {
    deviceId: 4,
    status: true,
    value: 0
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('🔧 Possible issues:');
  console.log('  1. Socket.IO server not running on port 5002');
  console.log('  2. Firewall blocking WebSocket connections');
  console.log('  3. CORS misconfiguration');
  console.log('  4. Nginx proxy not configured for WebSocket');
});

socket.on('control_success', (data) => {
  console.log('✅ Control successful:', data);
  socket.disconnect();
});

socket.on('control_error', (data) => {
  console.log('❌ Control error:', data);
  socket.disconnect();
});

// Timeout after 10 seconds
setTimeout(() => {
  if (socket.connected) {
    socket.disconnect();
  } else {
    console.log('❌ Connection timeout - server not responding');
  }
  process.exit(0);
}, 10000);
