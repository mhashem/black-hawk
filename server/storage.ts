import { 
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type UserCategoryPermission,
  type InsertUserCategoryPermission,
  type Service, 
  type InsertService,
  type HealthData,
  type InsertHealthData,
  type ServiceInfo,
  type InsertServiceInfo,
  type KafkaStreamsInfo,
  type InsertKafkaStreamsInfo,
  type ServiceWithDetails,
  type UserWithPermissions,
  type HealthSummary,
  users,
  categories,
  userCategoryPermissions,
  services,
  healthData,
  serviceInfo,
  kafkaStreamsInfo
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management operations
  createUser(user: { email: string; firstName?: string; lastName?: string; role: string; profileImageUrl?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUserWithPermissions(id: string): Promise<UserWithPermissions | undefined>;
  
  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getAllCategories(): Promise<Category[]>;
  deleteCategory(id: string): Promise<boolean>;
  
  // User permission operations
  setUserCategoryPermissions(userId: string, categoryIds: string[]): Promise<void>;
  getUserCategories(userId: string): Promise<Category[]>;
  
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesByCategories(categoryIds: string[]): Promise<Service[]>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  // Health data operations
  upsertHealthData(healthData: InsertHealthData): Promise<HealthData>;
  getHealthDataByServiceId(serviceId: string): Promise<HealthData | undefined>;
  
  // Service info operations
  upsertServiceInfo(serviceInfo: InsertServiceInfo): Promise<ServiceInfo>;
  getServiceInfoByServiceId(serviceId: string): Promise<ServiceInfo | undefined>;
  
  // Kafka streams operations
  upsertKafkaStreamsInfo(kafkaInfo: InsertKafkaStreamsInfo): Promise<KafkaStreamsInfo>;
  getKafkaStreamsInfoByServiceId(serviceId: string): Promise<KafkaStreamsInfo | undefined>;
  
  // Combined operations
  getServicesWithDetails(categoryIds?: string[]): Promise<ServiceWithDetails[]>;
  getHealthSummary(categoryIds?: string[]): Promise<HealthSummary>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management operations
  async createUser(userData: { email: string; firstName?: string; lastName?: string; role: string; profileImageUrl?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserWithPermissions(id: string): Promise<UserWithPermissions | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const userCategories = await this.getUserCategories(id);
    return { ...user, categories: userCategories };
  }

  // Category operations
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // User permission operations
  async setUserCategoryPermissions(userId: string, categoryIds: string[]): Promise<void> {
    // Delete existing permissions
    await db.delete(userCategoryPermissions).where(eq(userCategoryPermissions.userId, userId));
    
    // Insert new permissions
    if (categoryIds.length > 0) {
      await db.insert(userCategoryPermissions).values(
        categoryIds.map(categoryId => ({ userId, categoryId }))
      );
    }
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    const result = await db
      .select({ category: categories })
      .from(userCategoryPermissions)
      .innerJoin(categories, eq(userCategoryPermissions.categoryId, categories.id))
      .where(eq(userCategoryPermissions.userId, userId));
    
    return result.map(row => row.category);
  }

  // Service operations
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServicesByCategories(categoryIds: string[]): Promise<Service[]> {
    if (categoryIds.length === 0) return [];
    const serviceList = await db.select().from(services).where(eq(services.categoryId, categoryIds[0])); // Simplified for now
    return serviceList;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<boolean> {
    // Delete related data first
    await db.delete(healthData).where(eq(healthData.serviceId, id));
    await db.delete(serviceInfo).where(eq(serviceInfo.serviceId, id));
    await db.delete(kafkaStreamsInfo).where(eq(kafkaStreamsInfo.serviceId, id));
    
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Health data operations
  async upsertHealthData(healthDataInput: InsertHealthData): Promise<HealthData> {
    const [data] = await db
      .insert(healthData)
      .values({ ...healthDataInput, lastChecked: new Date() })
      .onConflictDoUpdate({
        target: healthData.serviceId,
        set: {
          status: healthDataInput.status,
          healthComponents: healthDataInput.healthComponents,
          lastChecked: new Date(),
        },
      })
      .returning();
    return data;
  }

  async getHealthDataByServiceId(serviceId: string): Promise<HealthData | undefined> {
    const [data] = await db.select().from(healthData).where(eq(healthData.serviceId, serviceId));
    return data;
  }

  // Service info operations
  async upsertServiceInfo(serviceInfoInput: InsertServiceInfo): Promise<ServiceInfo> {
    const [info] = await db
      .insert(serviceInfo)
      .values({ ...serviceInfoInput, lastUpdated: new Date() })
      .onConflictDoUpdate({
        target: serviceInfo.serviceId,
        set: {
          version: serviceInfoInput.version,
          branch: serviceInfoInput.branch,
          buildTime: serviceInfoInput.buildTime,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return info;
  }

  async getServiceInfoByServiceId(serviceId: string): Promise<ServiceInfo | undefined> {
    const [info] = await db.select().from(serviceInfo).where(eq(serviceInfo.serviceId, serviceId));
    return info;
  }

  // Kafka streams operations
  async upsertKafkaStreamsInfo(kafkaInfoInput: InsertKafkaStreamsInfo): Promise<KafkaStreamsInfo> {
    const [info] = await db
      .insert(kafkaStreamsInfo)
      .values({ ...kafkaInfoInput, lastUpdated: new Date() })
      .onConflictDoUpdate({
        target: kafkaStreamsInfo.serviceId,
        set: {
          state: kafkaInfoInput.state,
          threads: kafkaInfoInput.threads,
          topics: kafkaInfoInput.topics,
          partitions: kafkaInfoInput.partitions,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return info;
  }

  async getKafkaStreamsInfoByServiceId(serviceId: string): Promise<KafkaStreamsInfo | undefined> {
    const [info] = await db.select().from(kafkaStreamsInfo).where(eq(kafkaStreamsInfo.serviceId, serviceId));
    return info;
  }

  // Combined operations
  async getServicesWithDetails(categoryIds?: string[]): Promise<ServiceWithDetails[]> {
    let allServices: Service[];
    
    if (categoryIds && categoryIds.length > 0) {
      allServices = await db.select().from(services).where(eq(services.categoryId, categoryIds[0])); // Simplified for now
    } else {
      allServices = await db.select().from(services);
    }
    
    const result: ServiceWithDetails[] = [];
    
    for (const service of allServices) {
      const [healthDataResult] = await db.select().from(healthData).where(eq(healthData.serviceId, service.id));
      const [serviceInfoResult] = await db.select().from(serviceInfo).where(eq(serviceInfo.serviceId, service.id));
      const [kafkaStreamsResult] = await db.select().from(kafkaStreamsInfo).where(eq(kafkaStreamsInfo.serviceId, service.id));
      const [categoryResult] = await db.select().from(categories).where(eq(categories.id, service.categoryId));
      
      result.push({
        ...service,
        healthData: healthDataResult,
        serviceInfo: serviceInfoResult,
        kafkaStreamsInfo: kafkaStreamsResult,
        category: categoryResult,
      });
    }
    
    return result;
  }

  async getHealthSummary(categoryIds?: string[]): Promise<HealthSummary> {
    let allServices: Service[];
    
    if (categoryIds && categoryIds.length > 0) {
      allServices = await db.select().from(services).where(eq(services.categoryId, categoryIds[0])); // Simplified for now
    } else {
      allServices = await db.select().from(services);
    }
    const totalServices = allServices.length;
    
    let healthyServices = 0;
    let unhealthyServices = 0;
    
    for (const service of allServices) {
      const [healthDataResult] = await db.select().from(healthData).where(eq(healthData.serviceId, service.id));
      if (healthDataResult?.status === 'UP') {
        healthyServices++;
      } else if (healthDataResult?.status === 'DOWN') {
        unhealthyServices++;
      }
    }
    
    const unknownServices = totalServices - healthyServices - unhealthyServices;
    
    return {
      totalServices,
      healthyServices,
      unhealthyServices,
      unknownServices,
      lastUpdate: new Date().toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();

// Initialize default admin user and categories
export async function initializeDefaultData() {
  try {
    // Check if default admin exists
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length === 0) {
      await storage.createUser({
        email: "admin@servicehub.local",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        profileImageUrl: undefined,
      });
      
      // Update the admin to be non-deletable
      const adminUsers = await storage.getAllUsers();
      if (adminUsers.length > 0) {
        await storage.updateUser(adminUsers[0].id, { canDelete: false });
      }
    }
    
    // Create default categories
    const existingCategories = await storage.getAllCategories();
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: "Authentication", description: "User authentication and authorization services" },
        { name: "Commerce", description: "E-commerce and payment processing services" },
        { name: "Communication", description: "Messaging and notification services" },
        { name: "Data", description: "Data processing and analytics services" },
        { name: "Financial", description: "Financial and accounting services" },
        { name: "Warehouse", description: "Inventory and warehouse management services" },
      ];
      
      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
    }
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}
