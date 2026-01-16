import { devices, type Device, type InsertDevice, deviceLogs, type DeviceLog, type InsertDeviceLog, settings } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  updateDevice(id: number, status: boolean, value?: number): Promise<Device>;
  logAction(log: InsertDeviceLog): Promise<DeviceLog>;
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string): Promise<void>;
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
    try {
      // Use id directly as it matches the MQTT payload id
      const [updated] = await db
        .update(devices)
        .set({ status, value: value !== undefined ? value : 0, lastSeen: new Date() })
        .where(eq(devices.id, id))
        .returning();
      
      if (!updated) {
        console.log(`Creating missing device with id: ${id}`);
        // Create missing device instead of throwing error
        const [inserted] = await db.insert(devices).values({
          id,
          name: id === 6 ? "AC" : `Lampu ${id}`,
          type: id === 6 ? "ac" : "light",
          status,
          value: value || 0,
          room: "1.0.1",
          lastSeen: new Date()
        })
        .onConflictDoUpdate({
          target: devices.id,
          set: { status, value: value || 0, lastSeen: new Date() }
        })
        .returning();
        return inserted;
      }
      return updated;
    } catch (error) {
      console.error(`Error updating device ${id}:`, error);
      const [device] = await db.select().from(devices).where(eq(devices.id, id));
      if (device) return device;
      throw error;
    }
  }

  async logAction(log: InsertDeviceLog): Promise<DeviceLog> {
    const [newLog] = await db.insert(deviceLogs).values(log).returning();
    return newLog;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() }
      });
  }
}

export const storage = new DatabaseStorage();
