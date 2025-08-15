import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { StatsOverview } from "@/components/stats-overview";
import { ServiceCard } from "@/components/service-card";
import { ServiceDetailsModal } from "@/components/service-details-modal";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { ServiceWithDetails } from "@shared/schema";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<ServiceWithDetails | null>(null);
  const [filter, setFilter] = useState<"all" | "healthy" | "issues">("all");

  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => api.getServices(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ["/api/health/summary"],
    queryFn: () => api.getHealthSummary(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const refreshMutation = useMutation({
    mutationFn: api.refreshServices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health/summary"] });
      toast({
        title: "Success",
        description: "Services refreshed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh services",
        variant: "destructive",
      });
    },
  });

  const filteredServices = services?.filter((service) => {
    switch (filter) {
      case "healthy":
        return service.healthData?.status === "UP";
      case "issues":
        return service.healthData?.status === "DOWN" || !service.healthData?.status;
      default:
        return true;
    }
  }) || [];

  if (servicesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600">Please check if the backend server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <div className="ml-4 lg:ml-0">
                <h2 className="text-2xl font-bold text-slate-800">
                  Microservices Dashboard
                </h2>
                <p className="text-sm text-slate-600">
                  Monitor your Spring Boot services in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full status-pulse"></div>
                <span className="text-sm text-slate-600">
                  Last updated:{" "}
                  <span>
                    {summary?.lastUpdate
                      ? formatDistanceToNow(new Date(summary.lastUpdate), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                <i className={`fas fa-sync-alt ${refreshMutation.isPending ? 'animate-spin' : ''}`}></i>
              </Button>
              <Link href="/register">
                <Button size="sm">
                  <i className="fas fa-plus mr-2"></i>
                  Add Service
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Overview */}
          <StatsOverview summary={summary!} isLoading={summaryLoading} />

          {/* Service Cards Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              Services Overview
            </h3>
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-slate-100 text-slate-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === "healthy"
                    ? "bg-slate-100 text-slate-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setFilter("healthy")}
              >
                Healthy
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === "issues"
                    ? "bg-slate-100 text-slate-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setFilter("issues")}
              >
                Issues
              </button>
            </div>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-slate-200 rounded-full mr-2"></div>
                      <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-3 w-12 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-6 w-32 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-20 bg-slate-200 rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-12 bg-slate-200 rounded"></div>
                      <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-16 bg-slate-200 rounded"></div>
                      <div className="h-4 w-12 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-server text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {filter === "all" ? "No services registered" : "No services match your filter"}
              </h3>
              <p className="text-slate-500 mb-4">
                {filter === "all" 
                  ? "Get started by registering your first microservice"
                  : "Try adjusting your filter or register more services"
                }
              </p>
              {filter === "all" && (
                <Link href="/register">
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Service
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => setSelectedService(service)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Service Details Modal */}
      <ServiceDetailsModal
        service={selectedService}
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}
