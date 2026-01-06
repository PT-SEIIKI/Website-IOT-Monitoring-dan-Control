import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'light' or 'ac'
  status: boolean("status").notNull().default(false),
  value: integer("value"), // temperature for AC
  room: text("room").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const deviceLogs = pgTable("device_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  action: text("action").notNull(),
  value: text("value"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices);
export const insertDeviceLogSchema = createInsertSchema(deviceLogs);

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type DeviceLog = typeof deviceLogs.$inferSelect;
export type InsertDeviceLog = z.infer<typeof insertDeviceLogSchema>;
