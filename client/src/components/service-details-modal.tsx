import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ServiceWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

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
  if (!service) return null;

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
                <span className="text-slate-500">Group:</span>
                <span className="ml-2 font-medium">{service.group}</span>
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

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
