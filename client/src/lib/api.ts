import { apiRequest } from "./queryClient";
import type { ServiceWithDetails, HealthSummary, InsertService, Category, User, UserWithPermissions } from "@shared/schema";

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

  // Category API
  async getCategories(): Promise<Category[]> {
    const response = await apiRequest("GET", "/api/categories");
    return response.json();
  },

  async createCategory(category: { name: string; description?: string }): Promise<Category> {
    const response = await apiRequest("POST", "/api/categories", category);
    return response.json();
  },

  async deleteCategory(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/categories/${id}`);
  },

  // User API
  async getUsers(): Promise<User[]> {
    const response = await apiRequest("GET", "/api/users");
    return response.json();
  },

  async createUser(user: { email: string; firstName?: string; lastName?: string; role: string }): Promise<User> {
    const response = await apiRequest("POST", "/api/users", user);
    return response.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiRequest("PUT", `/api/users/${id}`, updates);
    return response.json();
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/users/${id}`);
  },

  async updateUserPermissions(id: string, categoryIds: string[]): Promise<void> {
    await apiRequest("PUT", `/api/users/${id}/permissions`, { categoryIds });
  },
};
