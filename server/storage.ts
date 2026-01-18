import { devices, deviceLogs, settings, schedules, installations, dailyEnergy } from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export type Device = typeof devices.$inferSelect;
export type DeviceLog = typeof deviceLogs.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;
export type InsertDeviceLog = typeof deviceLogs.$inferInsert;

export interface IStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  updateDevice(id: number, status: boolean, value?: number): Promise<Device>;
  logAction(log: InsertDeviceLog): Promise<DeviceLog>;
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string): Promise<void>;
  getSchedules(): Promise<any[]>;
  createSchedule(schedule: any): Promise<any>;
  updateSchedule(id: number, schedule: Partial<any>): Promise<any>;
  deleteSchedule(id: number): Promise<void>;
  getInstallations(): Promise<any[]>;
  createInstallation(installation: any): Promise<any>;
  updateInstallation(id: number, installation: Partial<any>): Promise<any>;
  deleteInstallation(id: number): Promise<void>;
  getDailyEnergy(): Promise<any[]>;
  saveDailyEnergy(energy: any): Promise<any>;
  getLogs(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async updateDevice(id: number, status: boolean, value?: number, kwh?: number): Promise<Device> {
    try {
      const updateObj: any = { lastSeen: new Date() };
      if (status !== undefined && (status as any) !== (null as any)) updateObj.status = status;
      if (value !== undefined) updateObj.value = value;
      if (kwh !== undefined) updateObj.kwh = kwh;

      const [updated] = await db
        .update(devices)
        .set(updateObj)
        .where(eq(devices.id, id))
        .returning();
      
      if (!updated) {
        const [inserted] = await db.insert(devices).values({
          id,
          name: `Lampu ${id}`,
          type: "light",
          status: status || false,
          value: value || 0,
          kwh: kwh || 0,
          room: "1.0.1",
          lastSeen: new Date()
        })
        .onConflictDoUpdate({
          target: devices.id,
          set: updateObj
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

  async getSchedules(): Promise<any[]> {
    return await db.select().from(schedules);
  }

  async createSchedule(schedule: any): Promise<any> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<any>): Promise<any> {
    const [updated] = await db.update(schedules).set(schedule).where(eq(schedules.id, id)).returning();
    return updated;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async getInstallations(): Promise<any[]> {
    return await db.select().from(installations);
  }

  async createInstallation(installation: any): Promise<any> {
    try {
      const dataToInsert = {
        lampId: installation.lampId,
        roomName: installation.roomName,
        roomId: installation.roomId,
        technicianName: installation.technicianName,
        wattage: parseFloat(installation.wattage || 3.6),
        installationDate: installation.installationDate ? new Date(installation.installationDate) : new Date(),
      };
      
      console.log("Saving installation to DB:", dataToInsert);
      const [newInstallation] = await db.insert(installations).values(dataToInsert).returning();
      console.log("Installation saved successfully:", newInstallation);
      return newInstallation;
    } catch (error) {
      console.error("Error in createInstallation:", error);
      throw error;
    }
  }

  async updateInstallation(id: number, installation: Partial<any>): Promise<any> {
    const [updated] = await db.update(installations).set(installation).where(eq(installations.id, id)).returning();
    return updated;
  }

  async deleteInstallation(id: number): Promise<void> {
    await db.delete(installations).where(eq(installations.id, id));
  }

  async getDailyEnergy(): Promise<any[]> {
    return await db.select().from(dailyEnergy);
  }

  async saveDailyEnergy(energy: any): Promise<any> {
    const [newEnergy] = await db.insert(dailyEnergy).values(energy).returning();
    return newEnergy;
  }

  async getLogs(): Promise<any[]> {
    return await db.select().from(deviceLogs).orderBy(desc(deviceLogs.timestamp)).limit(100);
  }
}

export const storage = new DatabaseStorage();
