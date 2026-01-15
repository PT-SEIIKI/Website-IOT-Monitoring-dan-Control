#!/usr/bin/env node

// Debug script to test socket.io connection and events
import { io } from "socket.io-client";

console.log('🔍 Debug Socket.io Connection to Production...');

const socket = io('https://iot.seyiki.com', {
  path: '/socket.io',
  transports: ['polling'], // Force polling
  reconnectionAttempts: 3,
  timeout: 5000,
});

// Log ALL events
socket.onAny((eventName, ...args) => {
  console.log('📨 Socket Event Received:', eventName, args);
});

socket.on('connect', () => {
  console.log('✅ Connected to production server!');
  console.log('Socket ID:', socket.id);
  console.log('Transport:', socket.io.engine.transport.name);
  
  // Test control command immediately
  console.log('🎯 Sending test control command for Lamp 4 OFF...');
  socket.emit('control_device', {
    deviceId: 4,
    status: false,
    value: 0
  });
  
  console.log('🎯 Sending test control command for Lamp 4 ON...');
  socket.emit('control_device', {
    deviceId: 4,
    status: true,
    value: 0
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('🔧 Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('control_success', (data) => {
  console.log('✅ Control successful:', data);
});

socket.on('control_error', (data) => {
  console.log('❌ Control error:', data);
});

// Monitor connection state
setInterval(() => {
  console.log('📊 Connection status:', {
    connected: socket.connected,
    id: socket.id,
    transport: socket.io.engine.transport?.name
  });
}, 2000);

// Timeout after 15 seconds
setTimeout(() => {
  console.log('⏰ Test completed...');
  if (socket.connected) {
    socket.disconnect();
  }
  process.exit(0);
}, 15000);
