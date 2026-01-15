// Test configuration script
import dotenv from 'dotenv';
import mqtt from 'mqtt';

dotenv.config();

console.log('=== Configuration Test ===');
console.log('PORT:', process.env.PORT);
console.log('SOCKET_IO_PORT:', process.env.SOCKET_IO_PORT);
console.log('MQTT_BROKER_URL:', process.env.MQTT_BROKER_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Test MQTT Connection
console.log('\n=== Testing MQTT Connection ===');
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('✅ MQTT Connection SUCCESS');
  console.log('Connected to:', process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');
  
  // Test subscription
  const topic = 'iot/monitoring/power-monitor-001/#';
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.log('❌ Subscription failed:', err.message);
    } else {
      console.log('✅ Subscribed to:', topic);
    }
  });
  
  // Test publish
  const testTopic = 'iot/monitoring/power-monitor-001/test';
  const testMessage = JSON.stringify({ test: 'connection', timestamp: Date.now() });
  mqttClient.publish(testTopic, testMessage, (err) => {
    if (err) {
      console.log('❌ Publish failed:', err.message);
    } else {
      console.log('✅ Published test message to:', testTopic);
    }
  });
  
  // Close after 3 seconds
  setTimeout(() => {
    mqttClient.end();
    console.log('\n=== Test Complete ===');
    process.exit(0);
  }, 3000);
});

mqttClient.on('error', (err) => {
  console.log('❌ MQTT Connection FAILED:', err.message);
  console.log('Make sure Mosquitto is running on:', process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');
  process.exit(1);
});

mqttClient.on('message', (topic, message) => {
  console.log('📨 Received message - Topic:', topic, 'Message:', message.toString());
});
