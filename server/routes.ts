import type { Express } from "express";
import { createServer, type Server } from "http";
import type { IStorage } from "./storage";
import { insertServiceSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";

// Background monitoring service
class MonitoringService {
  private intervalId: NodeJS.Timeout | null = null;
  private storage: IStorage | null = null;

  start(storage: IStorage) {
    this.storage = storage;
    // Run every 30 seconds
    this.intervalId = setInterval(() => {
      this.monitorServices();
    }, 30000);

    // Also run immediately
    this.monitorServices();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async monitorServices() {
    if (!this.storage) return;
    try {
      const services = await this.storage.getAllServices();
      
      for (const service of services) {
        await this.monitorService(service.id, service.url);
      }
    } catch (error) {
      console.error('Error during monitoring:', error);
    }
  }

  private async monitorService(serviceId: string, baseUrl: string) {
    try {
      // Monitor health endpoint
  const healthResponse = await axios.get(`${baseUrl}/actuator/health`, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      });

  await this.storage?.upsertHealthData({
        serviceId,
        status: healthResponse.status === 200 && healthResponse.data?.status === 'UP' ? 'UP' : 'DOWN',
        healthComponents: healthResponse.data?.components || null,
      });

      // Monitor info endpoint
      try {
        const infoResponse = await axios.get(`${baseUrl}/actuator/info`, {
          timeout: 5000,
        });

        if (infoResponse.status === 200 && infoResponse.data) {
          await this.storage?.upsertServiceInfo({
            serviceId,
            version: infoResponse.data.build?.version || null,
            branch: infoResponse.data.git?.branch || null,
            buildTime: infoResponse.data.build?.time || null,
          });
        }
      } catch (error) {
        console.log(`Info endpoint not available for service ${serviceId}`);
      }

      // Monitor Kafka Streams endpoint
      try {
        const kafkaResponse = await axios.get(`${baseUrl}/actuator/kafkastreams`, {
          timeout: 5000,
        });

        if (kafkaResponse.status === 200 && kafkaResponse.data) {
          const kafkaData = kafkaResponse.data;
          await this.storage?.upsertKafkaStreamsInfo({
            serviceId,
            state: kafkaData.state || null,
            threads: kafkaData.threads ? kafkaData.threads.toString() : null,
            topics: Array.isArray(kafkaData.topics) ? kafkaData.topics.join(', ') : null,
            partitions: kafkaData.partitions ? kafkaData.partitions.toString() : null,
          });
        }
      } catch (error) {
        console.log(`Kafka streams endpoint not available for service ${serviceId}`);
      }

    } catch (error) {
      // Service is unreachable
      await this.storage?.upsertHealthData({
        serviceId,
        status: 'DOWN',
        healthComponents: null,
      });
    }
  }
}

const monitoringService = new MonitoringService();

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  // Get all services with details
  app.get("/api/services", async (req, res) => {
    try {
  const services = await storage.getServicesWithDetails();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get health summary
  app.get("/api/health/summary", async (req, res) => {
    try {
      const summary = await storage.getHealthSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching health summary:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register a new service
  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error('Error creating service:', error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get a specific service
  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const healthData = await storage.getHealthDataByServiceId(service.id);
      const serviceInfo = await storage.getServiceInfoByServiceId(service.id);
      const kafkaStreamsInfo = await storage.getKafkaStreamsInfoByServiceId(service.id);

      const serviceWithDetails = {
        ...service,
        healthData,
        serviceInfo,
        kafkaStreamsInfo,
      };

      res.json(serviceWithDetails);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a service
  app.put("/api/services/:id", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, validatedData);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error('Error updating service:', error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Delete a service
  app.delete("/api/services/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteService(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manual refresh endpoint
  app.post("/api/services/refresh", async (req, res) => {
    try {
      // Trigger immediate monitoring
      const services = await storage.getAllServices();
      res.json({ message: `Refreshing ${services.length} services`, count: services.length });
    } catch (error) {
      console.error('Error triggering refresh:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Start monitoring service with the injected storage
  monitoringService.start(storage);

  // Cleanup on server close
  httpServer.on('close', () => {
    monitoringService.stop();
  });

  return httpServer;
}
