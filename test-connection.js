#!/usr/bin/env node

// Test script to verify socket.io connection
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mqtt from 'mqtt';

dotenv.config();

console.log('🧪 Testing Complete IoT System...');

// Test MQTT Connection
console.log('\n1️⃣ Testing MQTT Connection...');
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('✅ MQTT Connection SUCCESS');
  
  // Test Socket.IO Server
  console.log('\n2️⃣ Testing Socket.IO Server...');
  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });
  
  io.on('connection', (socket) => {
    console.log('✅ Socket.IO Client connected:', socket.id);
    
    socket.on('control_device', (data) => {
      console.log('🎯 Received control_device:', data);
      
      // Simulate MQTT publish
      const controlTopic = `iot/monitoring/power-monitor-001/control`;
      const controlPayload = {
        relay: data.deviceId,
        action: data.status ? "on" : "off"
      };
      
      console.log('📤 Publishing to MQTT:', controlTopic, controlPayload);
      mqttClient.publish(controlTopic, JSON.stringify(controlPayload));
      
      // Send success response
      socket.emit('control_success', { deviceId: data.deviceId, status: data.status });
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Socket.IO Client disconnected');
    });
  });
  
  httpServer.listen(5002, () => {
    console.log('✅ Socket.IO Server running on port 5002');
    console.log('\n🎯 Test Instructions:');
    console.log('1. Open browser and go to http://localhost:5000 (frontend)');
    console.log('2. Check browser console for connection logs');
    console.log('3. Try clicking lamp controls');
    console.log('4. Watch this terminal for control events');
    console.log('\n💡 Expected browser logs:');
    console.log('   "✅ Connected to IoT Backend via WebSocket on: http://localhost:5000"');
    console.log('   "🎯 Control successful: {deviceId: 1, status: true}"');
  });
});

mqttClient.on('error', (err) => {
  console.log('❌ MQTT Connection FAILED:', err.message);
  process.exit(1);
});
