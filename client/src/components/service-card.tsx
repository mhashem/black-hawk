import { Card, CardContent } from "@/components/ui/card";
import type { ServiceWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ServiceCardProps {
  service: ServiceWithDetails;
  onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "UP":
        return {
          color: "bg-green-400",
          text: "HEALTHY",
          textColor: "text-green-700",
        };
      case "DOWN":
        return {
          color: "bg-red-400",
          text: "DOWN",
          textColor: "text-red-700",
        };
      default:
        return {
          color: "bg-orange-400",
          text: "UNKNOWN",
          textColor: "text-orange-700",
        };
    }
  };

  const getKafkaStatus = (state?: string) => {
    switch (state) {
      case "RUNNING":
        return { text: "RUNNING", color: "text-green-600" };
      case "ERROR":
        return { text: "ERROR", color: "text-red-600" };
      default:
        return { text: "N/A", color: "text-slate-500" };
    }
  };

  const statusInfo = getStatusInfo(service.healthData?.status);
  const kafkaStatus = getKafkaStatus(service.kafkaStreamsInfo?.state || undefined);

  const formatLastChecked = (lastChecked?: Date) => {
    if (!lastChecked) return "Never";
    return formatDistanceToNow(new Date(lastChecked), { addSuffix: true });
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 ${statusInfo.color} rounded-full mr-2`}></div>
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {service.serviceInfo?.version || "No version"}
          </div>
        </div>

        <h4 className="text-lg font-semibold text-slate-800 mb-2">
          {service.name}
        </h4>
        <p className="text-sm text-slate-600 mb-3">{service.group}</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Branch:</span>
            <span className="text-slate-700 font-medium">
              {service.serviceInfo?.branch || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last Check:</span>
            <span className="text-slate-700 font-medium">
              {formatLastChecked(service.healthData?.lastChecked || undefined)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Build Time:</span>
            <span className="text-slate-700 font-medium text-xs">
              {service.serviceInfo?.buildTime || "Unknown"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className={`fas fa-stream ${kafkaStatus.color === "text-green-600" ? "text-blue-500" : "text-slate-400"} text-xs`}></i>
              <span className="text-xs text-slate-600">Kafka Streams</span>
            </div>
            <span className={`text-xs font-medium ${kafkaStatus.color}`}>
              {kafkaStatus.text}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
