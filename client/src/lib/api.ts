import { apiRequest } from "./queryClient";
import type { ServiceWithDetails, HealthSummary, InsertService } from "@shared/schema";

export const api = {
  async getServices(): Promise<ServiceWithDetails[]> {
    const response = await apiRequest("GET", "/api/services");
    return response.json();
  },

  async getHealthSummary(): Promise<HealthSummary> {
    const response = await apiRequest("GET", "/api/health/summary");
    return response.json();
  },

  async createService(service: InsertService): Promise<ServiceWithDetails> {
    const response = await apiRequest("POST", "/api/services", service);
    return response.json();
  },

  async getService(id: string): Promise<ServiceWithDetails> {
    const response = await apiRequest("GET", `/api/services/${id}`);
    return response.json();
  },

  async updateService(id: string, service: Partial<InsertService>): Promise<ServiceWithDetails> {
    const response = await apiRequest("PUT", `/api/services/${id}`, service);
    return response.json();
  },

  async deleteService(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/services/${id}`);
  },

  async refreshServices(): Promise<{ message: string; count: number }> {
    const response = await apiRequest("POST", "/api/services/refresh");
    return response.json();
  },
};
