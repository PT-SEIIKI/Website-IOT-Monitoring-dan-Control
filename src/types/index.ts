export type UserRole = 'admin' | 'karyawan';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Room {
  id: number;
  name: string;
  floor: number;
  building: string;
  esp32Id: string;
  lampStatus: boolean;
  acStatus: boolean;
  isOnline: boolean;
  lastSeen: Date;
  currentPowerWatt: number;
}

export interface PowerLog {
  id: number;
  roomId: number;
  roomName: string;
  deviceType: 'lamp' | 'ac';
  powerWatt: number;
  kwh: number;
  cost: number;
  timestamp: Date;
}

export interface ControlLog {
  id: number;
  roomId: number;
  roomName: string;
  userId: number;
  userName: string;
  deviceType: 'lamp' | 'ac';
  action: 'turn_on' | 'turn_off';
  timestamp: Date;
}

export interface Schedule {
  id: number;
  roomId: number;
  roomName: string;
  deviceType: 'lamp' | 'ac';
  action: 'turn_on' | 'turn_off';
  time: string;
  daysOfWeek: string[];
  isActive: boolean;
}

export interface DashboardStats {
  totalRooms: number;
  activeDevices: number;
  todayKwh: number;
  todayCost: number;
  lampsOn: number;
  acsOn: number;
}
