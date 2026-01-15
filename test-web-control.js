#!/usr/bin/env node

// Test script to simulate web control flow
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

console.log('🧪 Testing Web Control Flow...');

// Create Socket.IO Server (simulating backend)
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('✅ Socket.IO Client connected:', socket.id);
  
  socket.on('control_device', (data) => {
    console.log('🎯 Received control_device:', data);
    
    // Simulate the exact same logic as server
    const { deviceId, status, value } = data;
    console.log(`Web Control: Lamp ${deviceId} ->`, { status, value });
    
    // Simulate MQTT publish (what should happen)
    const ESP32_DEVICE_ID = "power-monitor-001";
    const controlTopic = `iot/monitoring/${ESP32_DEVICE_ID}/control`;
    const controlPayload = {
      relay: deviceId,
      action: status ? "on" : "off"
    };
    
    console.log(`📤 Should publish to MQTT: ${controlTopic}:`, controlPayload);
    console.log(`📋 Equivalent mosquitto_pub command:`);
    console.log(`   mosquitto_pub -h localhost -t ${controlTopic} -m '${JSON.stringify(controlPayload)}'`);
    
    // Send success response
    socket.emit('control_success', { deviceId: data.deviceId, status: data.status });
    console.log('✅ Sent control_success response');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Socket.IO Client disconnected');
  });
});

httpServer.listen(5002, () => {
  console.log('✅ Test Socket.IO Server running on port 5002');
  console.log('\n🎯 Test Instructions:');
  console.log('1. Open browser and go to http://localhost:5000 (frontend)');
  console.log('2. Check browser console for connection logs');
  console.log('3. Try clicking any lamp control (L1, L2, L3, L4, L5)');
  console.log('4. Watch this terminal for control events');
  console.log('\n💡 Expected browser logs:');
  console.log('   "✅ Connected to IoT Backend via WebSocket on: http://localhost:5000"');
  console.log('   "🎯 Control successful: {deviceId: 4, status: true}"');
  console.log('\n🔍 This will show exactly what the web interface sends!');
});
