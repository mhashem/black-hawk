import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  group: text("group").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const healthData = pgTable("health_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull(),
  status: text("status").notNull(), // UP, DOWN, UNKNOWN
  healthComponents: jsonb("health_components"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const serviceInfo = pgTable("service_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull(),
  version: text("version"),
  branch: text("branch"),
  buildTime: text("build_time"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const kafkaStreamsInfo = pgTable("kafka_streams_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull(),
  state: text("state"),
  threads: text("threads"),
  topics: text("topics"),
  partitions: text("partitions"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  lastChecked: true,
});

export const insertServiceInfoSchema = createInsertSchema(serviceInfo).omit({
  id: true,
  lastUpdated: true,
});

export const insertKafkaStreamsInfoSchema = createInsertSchema(kafkaStreamsInfo).omit({
  id: true,
  lastUpdated: true,
});

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type HealthData = typeof healthData.$inferSelect;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type ServiceInfo = typeof serviceInfo.$inferSelect;
export type InsertServiceInfo = z.infer<typeof insertServiceInfoSchema>;
export type KafkaStreamsInfo = typeof kafkaStreamsInfo.$inferSelect;
export type InsertKafkaStreamsInfo = z.infer<typeof insertKafkaStreamsInfoSchema>;

export interface ServiceWithDetails extends Service {
  healthData?: HealthData;
  serviceInfo?: ServiceInfo;
  kafkaStreamsInfo?: KafkaStreamsInfo;
}

export interface HealthSummary {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  unknownServices: number;
  lastUpdate: string;
}
