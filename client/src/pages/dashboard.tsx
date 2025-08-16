import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { StatsOverview } from "@/components/stats-overview";
import { ServiceCard } from "@/components/service-card";
import { ServiceDetailsModal } from "@/components/service-details-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ServiceWithDetails, Category } from "@shared/schema";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceWithDetails | null>(null);
  const [filter, setFilter] = useState<"all" | "healthy" | "issues">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => api.getServices(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: isAuthenticated,
  });

  // Handle services error
  useEffect(() => {
    if (servicesError && isUnauthorizedError(servicesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [servicesError, toast]);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ["/api/health/summary"],
    queryFn: () => api.getHealthSummary(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: isAuthenticated,
  });

  // Handle summary error
  useEffect(() => {
    if (summaryError && isUnauthorizedError(summaryError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [summaryError, toast]);

  const {
    data: categories,
  } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
    enabled: isAuthenticated,
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
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to refresh services",
        variant: "destructive",
      });
    },
  });

  const filteredServices = services?.filter((service) => {
    // Filter by health status
    let healthMatches = true;
    switch (filter) {
      case "healthy":
        healthMatches = service.healthData?.status === "UP";
        break;
      case "issues":
        healthMatches = service.healthData?.status === "DOWN" || !service.healthData?.status;
        break;
      default:
        healthMatches = true;
    }
    
    // Filter by category
    let categoryMatches = true;
    if (categoryFilter !== "all") {
      categoryMatches = service.categoryId === categoryFilter;
    }
    
    return healthMatches && categoryMatches;
  }) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                >
                  <i className={`fas fa-sync-alt ${refreshMutation.isPending ? 'animate-spin' : ''}`}></i>
                </Button>
              )}
              {isAdmin && (
                <Link href="/register">
                  <Button size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    Add Service
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Overview */}
          <StatsOverview summary={summary!} isLoading={summaryLoading} />

          {/* Service Cards Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Services Overview
              </h3>
              <div className="flex items-center space-x-4">
                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Category:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        categoryFilter === "all"
                          ? "bg-blue-100 text-blue-600"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      onClick={() => setCategoryFilter("all")}
                    >
                      All
                    </button>
                    {categories?.map((category) => (
                      <button
                        key={category.id}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          categoryFilter === category.id
                            ? "bg-blue-100 text-blue-600"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => setCategoryFilter(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Status:</span>
                  <div className="flex items-center space-x-1">
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
              </div>
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
