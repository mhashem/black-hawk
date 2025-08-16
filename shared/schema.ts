import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // admin, viewer
  isActive: boolean("is_active").notNull().default(true),
  canDelete: boolean("can_delete").notNull().default(true), // false for default admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table for custom service categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User category permissions for viewers
export const userCategoryPermissions = pgTable("user_category_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  categoryId: varchar("category_id").notNull(),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertUserCategoryPermissionSchema = createInsertSchema(userCategoryPermissions).omit({
  id: true,
  createdAt: true,
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UserCategoryPermission = typeof userCategoryPermissions.$inferSelect;
export type InsertUserCategoryPermission = z.infer<typeof insertUserCategoryPermissionSchema>;
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
  category?: Category;
}

export interface UserWithPermissions extends User {
  categories?: Category[];
}

export interface HealthSummary {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  unknownServices: number;
  lastUpdate: string;
}
