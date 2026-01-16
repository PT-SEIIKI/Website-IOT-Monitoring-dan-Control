import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'light' or 'ac'
  status: boolean("status").notNull().default(false),
  value: real("value"), // temperature for AC
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

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices);
export const selectDeviceSchema = createSelectSchema(devices);
export const insertDeviceLogSchema = createInsertSchema(deviceLogs);
export const selectDeviceLogSchema = createSelectSchema(deviceLogs);
export const insertLampSchema = createInsertSchema(lamps);
export const selectLampSchema = createSelectSchema(lamps);
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  roomName: text("room_name").notNull(),
  deviceType: text("device_type").notNull(), // 'lamp', 'lamp_1', etc.
  action: text("action").notNull(), // 'turn_on', 'turn_off'
  time: text("time").notNull(), // 'HH:MM'
  daysOfWeek: text("days_of_week").notNull(), // JSON string array
  isActive: boolean("is_active").notNull().default(true),
});

export const insertScheduleSchema = createInsertSchema(schedules);
export const selectScheduleSchema = createSelectSchema(schedules);
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;
