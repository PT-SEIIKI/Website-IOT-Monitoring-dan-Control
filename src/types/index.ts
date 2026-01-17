export type UserRole = 'admin' | 'karyawan';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lamp {
  id: number;
  name: string;
  status: boolean;
  brand?: string;
  wattage?: number;
  technician?: string;
  lastChanged?: Date;
}

export interface Room {
  id: number;
  name: string;
  floor: number;
  building: string;
  esp32Id: string;
  lampStatus: boolean;
  isOnline: boolean;
  lastSeen: Date;
  currentPowerWatt: number;
  lamps?: Lamp[];
}

export interface PowerLog {
  id: number;
  roomId: number;
  roomName: string;
  deviceType: 'lamp';
  powerWatt: number;
  kwh: number;
  cost: number;
  timestamp: Date;
}

export interface ControlLog {
  id: number;
  roomId: number;
  roomName: string;
  lampId?: number;
  lampName?: string;
  userId: number;
  userName: string;
  deviceType: 'lamp';
  action: 'turn_on' | 'turn_off' | 'replace';
  brand?: string;
  wattage?: number;
  technician?: string;
  timestamp: Date;
}

export interface Schedule {
  id: number;
  roomId: number;
  roomName: string;
  deviceType: 'lamp' | 'lamp_1' | 'lamp_2' | 'lamp_3' | 'lamp_4' | 'lamp_5' | 'lamp_6';
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
}
