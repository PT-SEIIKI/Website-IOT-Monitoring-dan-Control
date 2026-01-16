import { Room, PowerLog, ControlLog, DashboardStats } from '@/types';

export const ELECTRICITY_TARIFF = 1444.70; // Rp per kWh

export const mockRooms: Room[] = [
  { id: 1, name: 'Main Monitoring Room', floor: 1, building: 'Gedung Pusat', esp32Id: 'power-monitor-001', lampStatus: false, acStatus: false, isOnline: true, lastSeen: new Date(), currentPowerWatt: 0 },
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
    { id: 1, roomId: 1, roomName: 'Ruangan 1.0.1', userId: 1, userName: 'Admin User', deviceType: 'lamp', action: 'turn_on', timestamp: new Date(Date.now() - 300000) },
    { id: 2, roomId: 3, roomName: 'Ruangan 1.0.3', userId: 2, userName: 'Staff User', deviceType: 'lamp', action: 'turn_on', timestamp: new Date(Date.now() - 1800000) },
  ];
  
  return actions;
}

// Get dashboard stats
export function getDashboardStats(rooms: Room[]): DashboardStats {
  const lampsOn = rooms.filter(r => r.lampStatus).length;
  const activeDevices = lampsOn;
  
  // Simulate daily consumption
  const todayKwh = parseFloat((Math.random() * 50 + 100).toFixed(2));
  const todayCost = parseFloat((todayKwh * ELECTRICITY_TARIFF).toFixed(0));
  
  return {
    totalRooms: rooms.length,
    activeDevices,
    todayKwh,
    todayCost,
    lampsOn,
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
