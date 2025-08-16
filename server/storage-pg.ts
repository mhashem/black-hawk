import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { services, healthData, serviceInfo, kafkaStreamsInfo } from '@shared/schema';
import type {
  InsertService,
  Service,
  InsertHealthData,
  HealthData,
  InsertServiceInfo,
  ServiceInfo,
  InsertKafkaStreamsInfo,
  KafkaStreamsInfo,
  ServiceWithDetails,
  HealthSummary,
} from '@shared/schema';
import { randomUUID } from 'crypto';

export class PgStorage {
  pool: Pool;
  db: ReturnType<typeof drizzle>;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const now = new Date();
    await this.db.insert(services).values({
      id,
      name: insertService.name,
      url: insertService.url,
      group: insertService.group,
      createdAt: now,
      updatedAt: now,
    }).run();

    return {
      id,
      name: insertService.name,
      url: insertService.url,
      group: insertService.group,
      createdAt: now,
      updatedAt: now,
    } as Service;
  }

  async getService(id: string): Promise<Service | undefined> {
    const row = await this.db.select().from(services).where(services.id.eq(id)).get();
    return row as Service | undefined;
  }

  async getAllServices(): Promise<Service[]> {
    const rows = await this.db.select().from(services).all();
    return rows as Service[];
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const now = new Date();
    await this.db.update(services).set({
      ...('name' in updateData ? { name: updateData.name } : {}),
      ...('url' in updateData ? { url: updateData.url } : {}),
      ...('group' in updateData ? { group: updateData.group } : {}),
      updatedAt: now,
    }).where(services.id.eq(id)).run();

    return this.getService(id);
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await this.db.delete(services).where(services.id.eq(id)).run();
    // cascade cleanup
    await this.db.delete(healthData).where(healthData.serviceId.eq(id)).run();
    await this.db.delete(serviceInfo).where(serviceInfo.serviceId.eq(id)).run();
    await this.db.delete(kafkaStreamsInfo).where(kafkaStreamsInfo.serviceId.eq(id)).run();
    return result.rowCount > 0;
  }

  async upsertHealthData(h: InsertHealthData): Promise<HealthData> {
    // simple upsert by serviceId: delete existing then insert
    await this.db.delete(healthData).where(healthData.serviceId.eq(h.serviceId)).run();
    const id = randomUUID();
    const lastChecked = new Date();
    await this.db.insert(healthData).values({
      id,
      serviceId: h.serviceId,
      status: h.status,
      healthComponents: h.healthComponents || null,
      lastChecked,
    }).run();

    return {
      id,
      serviceId: h.serviceId,
      status: h.status,
      healthComponents: h.healthComponents || null,
      lastChecked,
    } as HealthData;
  }

  async getHealthDataByServiceId(serviceId: string): Promise<HealthData | undefined> {
    const row = await this.db.select().from(healthData).where(healthData.serviceId.eq(serviceId)).get();
    return row as HealthData | undefined;
  }

  async upsertServiceInfo(info: InsertServiceInfo): Promise<ServiceInfo> {
    await this.db.delete(serviceInfo).where(serviceInfo.serviceId.eq(info.serviceId)).run();
    const id = randomUUID();
    const lastUpdated = new Date();
    await this.db.insert(serviceInfo).values({
      id,
      serviceId: info.serviceId,
      version: info.version || null,
      branch: info.branch || null,
      buildTime: info.buildTime || null,
      lastUpdated,
    }).run();

    return {
      id,
      serviceId: info.serviceId,
      version: info.version || null,
      branch: info.branch || null,
      buildTime: info.buildTime || null,
      lastUpdated,
    } as ServiceInfo;
  }

  async getServiceInfoByServiceId(serviceId: string): Promise<ServiceInfo | undefined> {
    const row = await this.db.select().from(serviceInfo).where(serviceInfo.serviceId.eq(serviceId)).get();
    return row as ServiceInfo | undefined;
  }

  async upsertKafkaStreamsInfo(k: InsertKafkaStreamsInfo): Promise<KafkaStreamsInfo> {
    await this.db.delete(kafkaStreamsInfo).where(kafkaStreamsInfo.serviceId.eq(k.serviceId)).run();
    const id = randomUUID();
    const lastUpdated = new Date();
    await this.db.insert(kafkaStreamsInfo).values({
      id,
      serviceId: k.serviceId,
      state: k.state || null,
      threads: k.threads || null,
      topics: k.topics || null,
      partitions: k.partitions || null,
      lastUpdated,
    }).run();

    return {
      id,
      serviceId: k.serviceId,
      state: k.state || null,
      threads: k.threads || null,
      topics: k.topics || null,
      partitions: k.partitions || null,
      lastUpdated,
    } as KafkaStreamsInfo;
  }

  async getKafkaStreamsInfoByServiceId(serviceId: string): Promise<KafkaStreamsInfo | undefined> {
    const row = await this.db.select().from(kafkaStreamsInfo).where(kafkaStreamsInfo.serviceId.eq(serviceId)).get();
    return row as KafkaStreamsInfo | undefined;
  }

  async getServicesWithDetails(): Promise<ServiceWithDetails[]> {
    const svcs = await this.db.select().from(services).all();
    const results: ServiceWithDetails[] = [];
    for (const s of svcs) {
      const h = await this.getHealthDataByServiceId(s.id);
      const i = await this.getServiceInfoByServiceId(s.id);
      const k = await this.getKafkaStreamsInfoByServiceId(s.id);
      results.push({ ...s, healthData: h, serviceInfo: i, kafkaStreamsInfo: k });
    }
    return results;
  }

  async getHealthSummary(): Promise<HealthSummary> {
    const totalServices = (await this.db.select().from(services).all()).length;
    const healthRows = await this.db.select().from(healthData).all();
    const healthyServices = healthRows.filter(h => h.status === 'UP').length;
    const unhealthyServices = healthRows.filter(h => h.status === 'DOWN').length;
    const unknownServices = totalServices - healthyServices - unhealthyServices;
    return {
      totalServices,
      healthyServices,
      unhealthyServices,
      unknownServices,
      lastUpdate: new Date().toISOString(),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default PgStorage;
