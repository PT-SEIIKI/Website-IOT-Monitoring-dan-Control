import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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
export const selectDeviceSchema = createSelectSchema(devices);
export const insertDeviceLogSchema = createInsertSchema(deviceLogs);
export const selectDeviceLogSchema = createSelectSchema(deviceLogs);

export type Device = z.infer<typeof selectDeviceSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type DeviceLog = z.infer<typeof selectDeviceLogSchema>;
export type InsertDeviceLog = z.infer<typeof insertDeviceLogSchema>;
