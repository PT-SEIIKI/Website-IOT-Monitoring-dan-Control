// API client with direct HTTPS port
const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5001" 
  : "https://iot.seyiki.com";

const DIRECT_API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5002"
  : "https://iot.seyiki.com:5002"; // Direct HTTPS port

export const apiClient = {
  async controlDevice(deviceId: number, status: boolean, value: number = 0) {
    try {
      console.log('🎯 Sending API control request:', { deviceId, status, value });
      
      // Try direct HTTPS port first
      let response = await fetch(`${DIRECT_API_URL}/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, value }),
      });

      // If direct port fails, try proxy
      if (!response.ok) {
        console.log('🔄 Direct port failed, trying proxy...');
        response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}/control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, value }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API control successful:', result);
      return result;
    } catch (error) {
      console.error('❌ API control error:', error);
      throw error;
    }
  },

  async getDevices() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ API get devices error:', error);
      throw error;
    }
  }
};
