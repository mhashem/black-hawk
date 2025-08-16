import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeDefaultData } from "./storage";
import { insertServiceSchema, insertCategorySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import { setupAuth, isAuthenticated, requireAdmin } from "./replitAuth";

// Background monitoring service
class MonitoringService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
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
    try {
      const services = await storage.getAllServices();
      
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

      await storage.upsertHealthData({
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
          await storage.upsertServiceInfo({
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
          await storage.upsertKafkaStreamsInfo({
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
      await storage.upsertHealthData({
        serviceId,
        status: 'DOWN',
        healthComponents: null,
      });
    }
  }
}

const monitoringService = new MonitoringService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Initialize default data
  await initializeDefaultData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithPermissions(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error('Error creating category:', error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Ensure required fields are present
      if (!validatedData.email || !validatedData.role) {
        return res.status(400).json({ message: "Email and role are required" });
      }
      
      const user = await storage.createUser({
        email: validatedData.email,
        firstName: validatedData.firstName || undefined,
        lastName: validatedData.lastName || undefined,
        role: validatedData.role,
        profileImageUrl: validatedData.profileImageUrl || undefined,
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/users/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Filter out null/undefined values and ensure proper types
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== null && value !== undefined)
      );
      
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.canDelete) {
        return res.status(403).json({ message: "Cannot delete this user" });
      }
      
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id/permissions", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { categoryIds } = req.body;
      await storage.setUserCategoryPermissions(req.params.id, categoryIds || []);
      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error('Error updating user permissions:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all services with details (with permission filtering for viewers)
  app.get("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithPermissions(userId);
      
      let services;
      if (user?.role === 'admin') {
        services = await storage.getServicesWithDetails();
      } else {
        // Viewers can only see services in their permitted categories
        const categoryIds = user?.categories?.map(c => c.id) || [];
        services = await storage.getServicesWithDetails(categoryIds);
      }
      
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get health summary (with permission filtering for viewers)
  app.get("/api/health/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithPermissions(userId);
      
      let summary;
      if (user?.role === 'admin') {
        summary = await storage.getHealthSummary();
      } else {
        // Viewers can only see summary for their permitted categories
        const categoryIds = user?.categories?.map(c => c.id) || [];
        summary = await storage.getHealthSummary(categoryIds);
      }
      
      res.json(summary);
    } catch (error) {
      console.error('Error fetching health summary:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register a new service (admin only)
  app.post("/api/services", isAuthenticated, requireAdmin, async (req, res) => {
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
  app.get("/api/services/:id", isAuthenticated, async (req, res) => {
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

  // Update a service (admin only)
  app.put("/api/services/:id", isAuthenticated, requireAdmin, async (req, res) => {
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

  // Delete a service (admin only)
  app.delete("/api/services/:id", isAuthenticated, requireAdmin, async (req, res) => {
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

  // Manual refresh endpoint (admin only)
  app.post("/api/services/refresh", isAuthenticated, requireAdmin, async (req, res) => {
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

  // Start monitoring service
  monitoringService.start();

  // Cleanup on server close
  httpServer.on('close', () => {
    monitoringService.stop();
  });

  return httpServer;
}
