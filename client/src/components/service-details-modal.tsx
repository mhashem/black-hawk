import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ServiceWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ServiceDetailsModalProps {
  service: ServiceWithDetails | null;
  open: boolean;
  onClose: () => void;
}

export function ServiceDetailsModal({
  service,
  open,
  onClose,
}: ServiceDetailsModalProps) {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!service) return null;

  const deleteServiceMutation = useMutation({
    mutationFn: api.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health/summary"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteConfirmation("");
      onClose();
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
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const handleDeleteService = () => {
    if (deleteConfirmation === service.name) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "UP":
        return "text-green-600";
      case "DOWN":
        return "text-red-600";
      default:
        return "text-orange-600";
    }
  };

  const healthComponents = service.healthData?.healthComponents as any;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service.name} - Service Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3">
              Service Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Status:</span>
                <span
                  className={`ml-2 font-medium ${getStatusColor(
                    service.healthData?.status
                  )}`}
                >
                  {service.healthData?.status || "UNKNOWN"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Version:</span>
                <span className="ml-2 font-medium">
                  {service.serviceInfo?.version || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Branch:</span>
                <span className="ml-2 font-medium">
                  {service.serviceInfo?.branch || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Build Time:</span>
                <span className="ml-2 font-medium">
                  {service.serviceInfo?.buildTime || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Category:</span>
                <span className="ml-2 font-medium">{service.category?.name || "Uncategorized"}</span>
              </div>
              <div>
                <span className="text-slate-500">URL:</span>
                <span className="ml-2 font-medium text-xs">{service.url}</span>
              </div>
            </div>
          </div>

          {/* Health Details */}
          {healthComponents && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">
                Health Components
              </h4>
              <div className="space-y-2">
                {Object.entries(healthComponents).map(([key, value]: [string, any]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      value?.status === "UP" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <i
                        className={`fas ${
                          key === "db" || key === "database"
                            ? "fa-database"
                            : key === "kafka"
                            ? "fa-stream"
                            : key === "redis"
                            ? "fa-memory"
                            : "fa-cog"
                        } ${
                          value?.status === "UP"
                            ? "text-green-600"
                            : "text-red-600"
                        } mr-3`}
                      ></i>
                      <span className="font-medium capitalize">{key}</span>
                    </div>
                    <span
                      className={`font-medium ${
                        value?.status === "UP"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {value?.status || "UNKNOWN"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kafka Streams Topology */}
          {service.kafkaStreamsInfo && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">
                Kafka Streams Topology
              </h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">State:</span>
                    <span
                      className={`font-medium ${
                        service.kafkaStreamsInfo.state === "RUNNING"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {service.kafkaStreamsInfo.state || "UNKNOWN"}
                    </span>
                  </div>
                  {service.kafkaStreamsInfo.threads && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Threads:</span>
                      <span className="font-medium">
                        {service.kafkaStreamsInfo.threads}
                      </span>
                    </div>
                  )}
                  {service.kafkaStreamsInfo.topics && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Topics:</span>
                      <span className="font-medium text-xs">
                        {service.kafkaStreamsInfo.topics}
                      </span>
                    </div>
                  )}
                  {service.kafkaStreamsInfo.partitions && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Partitions:</span>
                      <span className="font-medium">
                        {service.kafkaStreamsInfo.partitions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center">
            Last checked:{" "}
            {service.healthData?.lastChecked
              ? formatDistanceToNow(new Date(service.healthData.lastChecked), {
                  addSuffix: true,
                })
              : "Never"}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {isAdmin && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <i className="fas fa-trash mr-2"></i>
                    Delete Service
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Service</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the service
                      <strong className="font-medium"> {service.name}</strong> and all its monitoring data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delete-confirmation">Type the service name to confirm deletion:</Label>
                      <Input
                        id="delete-confirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={service.name}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteService}
                      disabled={deleteConfirmation !== service.name || deleteServiceMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteServiceMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner animate-spin mr-2"></i>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-trash mr-2"></i>
                          Delete Service
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
