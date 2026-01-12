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

export const lamps = pgTable("lamps", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(), // references devices(id) for the room
  name: text("name").notNull(), // e.g., "Lampu 1", "Lampu 2"
  status: boolean("status").notNull().default(false),
  lastChanged: timestamp("last_changed").defaultNow(),
  brand: text("brand"),
  wattage: integer("wattage"),
  technician: text("technician"),
});

export const lampHistory = pgTable("lamp_history", {
  id: serial("id").primaryKey(),
  lampId: integer("lamp_id").notNull(),
  changeDate: timestamp("change_date").notNull().defaultNow(),
  brand: text("brand").notNull(),
  wattage: integer("wattage").notNull(),
  technician: text("technician").notNull(),
  notes: text("notes"),
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
export const insertLampSchema = createInsertSchema(lamps);
export const selectLampSchema = createSelectSchema(lamps);
export const insertLampHistorySchema = createInsertSchema(lampHistory);
export const selectLampHistorySchema = createSelectSchema(lampHistory);

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;
export type DeviceLog = typeof deviceLogs.$inferSelect;
export type InsertDeviceLog = typeof deviceLogs.$inferInsert;
export type Lamp = typeof lamps.$inferSelect;
export type InsertLamp = typeof lamps.$inferInsert;
export type LampHistory = typeof lampHistory.$inferSelect;
export type InsertLampHistory = typeof lampHistory.$inferInsert;
