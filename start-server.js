#!/usr/bin/env node

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import mqtt from 'mqtt';

dotenv.config();

console.log('🚀 Starting IoT Server...');
console.log('Configuration:');
console.log('- PORT:', process.env.PORT);
console.log('- SOCKET_IO_PORT:', process.env.SOCKET_IO_PORT);
console.log('- MQTT_BROKER_URL:', process.env.MQTT_BROKER_URL);

// Test MQTT Connection first
console.log('\n🔌 Testing MQTT Connection...');
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('✅ MQTT Connection SUCCESS');
  mqttClient.end();
  
  // Start the server
  console.log('\n🌟 Starting Node.js Server...');
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
});

mqttClient.on('error', (err) => {
  console.log('❌ MQTT Connection FAILED:', err.message);
  console.log('\n🔧 Solutions:');
  console.log('1. Install and start Mosquitto: sudo systemctl start mosquitto');
  console.log('2. Or run Mosquitto in Docker: docker run -it -p 1883:1883 eclipse-mosquitto');
  console.log('3. Or check if Mosquitto is running: sudo systemctl status mosquitto');
  process.exit(1);
});
