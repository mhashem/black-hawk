import { 
  type Service, 
  type InsertService,
  type HealthData,
  type InsertHealthData,
  type ServiceInfo,
  type InsertServiceInfo,
  type KafkaStreamsInfo,
  type InsertKafkaStreamsInfo,
  type ServiceWithDetails,
  type HealthSummary
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
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
  getServicesWithDetails(): Promise<ServiceWithDetails[]>;
  getHealthSummary(): Promise<HealthSummary>;
}

export class MemStorage implements IStorage {
  private services: Map<string, Service>;
  private healthData: Map<string, HealthData>;
  private serviceInfo: Map<string, ServiceInfo>;
  private kafkaStreamsInfo: Map<string, KafkaStreamsInfo>;

  constructor() {
    this.services = new Map();
    this.healthData = new Map();
    this.serviceInfo = new Map();
    this.kafkaStreamsInfo = new Map();
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      ...insertService,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.set(id, service);
    return service;
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService: Service = {
      ...service,
      ...updateData,
      updatedAt: new Date(),
    };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: string): Promise<boolean> {
    const deleted = this.services.delete(id);
    // Clean up related data
    this.healthData.delete(id);
    this.serviceInfo.delete(id);
    this.kafkaStreamsInfo.delete(id);
    return deleted;
  }

  async upsertHealthData(healthData: InsertHealthData): Promise<HealthData> {
    const existingData = Array.from(this.healthData.values()).find(
      (data) => data.serviceId === healthData.serviceId
    );
    
    const id = existingData?.id || randomUUID();
    const data: HealthData = {
      ...healthData,
      id,
      lastChecked: new Date(),
      healthComponents: healthData.healthComponents || null,
    };
    this.healthData.set(id, data);
    return data;
  }

  async getHealthDataByServiceId(serviceId: string): Promise<HealthData | undefined> {
    return Array.from(this.healthData.values()).find(
      (data) => data.serviceId === serviceId
    );
  }

  async upsertServiceInfo(serviceInfo: InsertServiceInfo): Promise<ServiceInfo> {
    const existingInfo = Array.from(this.serviceInfo.values()).find(
      (info) => info.serviceId === serviceInfo.serviceId
    );
    
    const id = existingInfo?.id || randomUUID();
    const info: ServiceInfo = {
      ...serviceInfo,
      id,
      lastUpdated: new Date(),
      version: serviceInfo.version || null,
      branch: serviceInfo.branch || null,
      buildTime: serviceInfo.buildTime || null,
    };
    this.serviceInfo.set(id, info);
    return info;
  }

  async getServiceInfoByServiceId(serviceId: string): Promise<ServiceInfo | undefined> {
    return Array.from(this.serviceInfo.values()).find(
      (info) => info.serviceId === serviceId
    );
  }

  async upsertKafkaStreamsInfo(kafkaInfo: InsertKafkaStreamsInfo): Promise<KafkaStreamsInfo> {
    const existingInfo = Array.from(this.kafkaStreamsInfo.values()).find(
      (info) => info.serviceId === kafkaInfo.serviceId
    );
    
    const id = existingInfo?.id || randomUUID();
    const info: KafkaStreamsInfo = {
      ...kafkaInfo,
      id,
      lastUpdated: new Date(),
      state: kafkaInfo.state || null,
      threads: kafkaInfo.threads || null,
      topics: kafkaInfo.topics || null,
      partitions: kafkaInfo.partitions || null,
    };
    this.kafkaStreamsInfo.set(id, info);
    return info;
  }

  async getKafkaStreamsInfoByServiceId(serviceId: string): Promise<KafkaStreamsInfo | undefined> {
    return Array.from(this.kafkaStreamsInfo.values()).find(
      (info) => info.serviceId === serviceId
    );
  }

  async getServicesWithDetails(): Promise<ServiceWithDetails[]> {
    const services = Array.from(this.services.values());
    return services.map(service => ({
      ...service,
      healthData: Array.from(this.healthData.values()).find(h => h.serviceId === service.id),
      serviceInfo: Array.from(this.serviceInfo.values()).find(i => i.serviceId === service.id),
      kafkaStreamsInfo: Array.from(this.kafkaStreamsInfo.values()).find(k => k.serviceId === service.id),
    }));
  }

  async getHealthSummary(): Promise<HealthSummary> {
    const healthDataArray = Array.from(this.healthData.values());
    const totalServices = this.services.size;
    const healthyServices = healthDataArray.filter(h => h.status === 'UP').length;
    const unhealthyServices = healthDataArray.filter(h => h.status === 'DOWN').length;
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

export const storage = new MemStorage();
