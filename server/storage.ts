import { devices, type Device, type InsertDevice, deviceLogs, type DeviceLog, type InsertDeviceLog } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  updateDevice(id: number, status: boolean, value?: number): Promise<Device>;
  logAction(log: InsertDeviceLog): Promise<DeviceLog>;
}

export class DatabaseStorage implements IStorage {
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async updateDevice(id: number, status: boolean, value?: number): Promise<Device> {
    const [updated] = await db
      .update(devices)
      .set({ status, value, lastSeen: new Date() })
      .where(eq(devices.id, id))
      .returning();
    
    if (!updated) {
      // Create missing device instead of throwing error
      const [inserted] = await db.insert(devices).values({
        id,
        name: id === 6 ? "AC" : `Lampu ${id}`,
        type: id === 6 ? "ac" : "light",
        status,
        value: value || 0,
        room: "1.0.1",
        lastSeen: new Date()
      }).returning();
      return inserted;
    }
    return updated;
  }

  async logAction(log: InsertDeviceLog): Promise<DeviceLog> {
    const [newLog] = await db.insert(deviceLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
