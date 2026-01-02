import { Room, PowerLog, ControlLog, DashboardStats } from '@/types';

export const ELECTRICITY_TARIFF = 1444.70; // Rp per kWh

export const mockRooms: Room[] = [
  { id: 1, name: 'Ruang 101', floor: 1, building: 'Gedung A', esp32Id: 'ESP32_001', lampStatus: true, acStatus: false, isOnline: true, lastSeen: new Date(), currentPowerWatt: 75 },
  { id: 2, name: 'Ruang 102', floor: 1, building: 'Gedung A', esp32Id: 'ESP32_002', lampStatus: false, acStatus: true, isOnline: true, lastSeen: new Date(), currentPowerWatt: 1200 },
  { id: 3, name: 'Ruang 201', floor: 2, building: 'Gedung A', esp32Id: 'ESP32_003', lampStatus: true, acStatus: true, isOnline: true, lastSeen: new Date(), currentPowerWatt: 1350 },
  { id: 4, name: 'Lab Komputer 1', floor: 2, building: 'Gedung B', esp32Id: 'ESP32_004', lampStatus: false, acStatus: false, isOnline: false, lastSeen: new Date(Date.now() - 3600000), currentPowerWatt: 0 },
  { id: 5, name: 'Lab Komputer 2', floor: 2, building: 'Gedung B', esp32Id: 'ESP32_005', lampStatus: true, acStatus: true, isOnline: true, lastSeen: new Date(), currentPowerWatt: 1425 },
  { id: 6, name: 'Ruang 301', floor: 3, building: 'Gedung A', esp32Id: 'ESP32_006', lampStatus: false, acStatus: false, isOnline: true, lastSeen: new Date(), currentPowerWatt: 0 },
  { id: 7, name: 'Ruang Rapat', floor: 1, building: 'Gedung B', esp32Id: 'ESP32_007', lampStatus: true, acStatus: false, isOnline: true, lastSeen: new Date(), currentPowerWatt: 85 },
  { id: 8, name: 'Aula', floor: 1, building: 'Gedung C', esp32Id: 'ESP32_008', lampStatus: false, acStatus: false, isOnline: true, lastSeen: new Date(), currentPowerWatt: 0 },
];

// Generate power consumption data for the last 24 hours
export function generatePowerChartData() {
  const data = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    
    // Simulate higher consumption during working hours (8-17)
    const baseConsumption = hour >= 8 && hour <= 17 ? 15 : 3;
    const variation = Math.random() * 5;
    
    data.push({
      time: time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      kwh: parseFloat((baseConsumption + variation).toFixed(2)),
      cost: parseFloat(((baseConsumption + variation) * ELECTRICITY_TARIFF).toFixed(0)),
    });
  }
  
  return data;
}

// Generate recent control logs
export function generateControlLogs(): ControlLog[] {
  const actions: ControlLog[] = [
    { id: 1, roomId: 1, roomName: 'Ruang 101', userId: 1, userName: 'Admin User', deviceType: 'lamp', action: 'turn_on', timestamp: new Date(Date.now() - 300000) },
    { id: 2, roomId: 3, roomName: 'Ruang 201', userId: 2, userName: 'Staff User', deviceType: 'ac', action: 'turn_on', timestamp: new Date(Date.now() - 900000) },
    { id: 3, roomId: 5, roomName: 'Lab Komputer 2', userId: 1, userName: 'Admin User', deviceType: 'lamp', action: 'turn_on', timestamp: new Date(Date.now() - 1800000) },
    { id: 4, roomId: 2, roomName: 'Ruang 102', userId: 2, userName: 'Staff User', deviceType: 'ac', action: 'turn_on', timestamp: new Date(Date.now() - 3600000) },
    { id: 5, roomId: 7, roomName: 'Ruang Rapat', userId: 1, userName: 'Admin User', deviceType: 'lamp', action: 'turn_on', timestamp: new Date(Date.now() - 7200000) },
  ];
  
  return actions;
}

// Get dashboard stats
export function getDashboardStats(rooms: Room[]): DashboardStats {
  const lampsOn = rooms.filter(r => r.lampStatus).length;
  const acsOn = rooms.filter(r => r.acStatus).length;
  const activeDevices = lampsOn + acsOn;
  
  // Simulate daily consumption
  const todayKwh = parseFloat((Math.random() * 50 + 100).toFixed(2));
  const todayCost = parseFloat((todayKwh * ELECTRICITY_TARIFF).toFixed(0));
  
  return {
    totalRooms: rooms.length,
    activeDevices,
    todayKwh,
    todayCost,
    lampsOn,
    acsOn,
  };
}

// Generate room consumption ranking
export function getRoomConsumptionRanking(rooms: Room[]) {
  return rooms
    .filter(r => r.currentPowerWatt > 0)
    .sort((a, b) => b.currentPowerWatt - a.currentPowerWatt)
    .slice(0, 5)
    .map(room => ({
      name: room.name,
      watt: room.currentPowerWatt,
      building: room.building,
    }));
}
