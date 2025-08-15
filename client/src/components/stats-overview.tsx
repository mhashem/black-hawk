import { Card, CardContent } from "@/components/ui/card";
import type { HealthSummary } from "@shared/schema";

interface StatsOverviewProps {
  summary: HealthSummary;
  isLoading: boolean;
}

export function StatsOverview({ summary, isLoading }: StatsOverviewProps) {
  const stats = [
    {
      name: "Total Services",
      value: summary?.totalServices || 0,
      icon: "fas fa-server",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-slate-800",
    },
    {
      name: "Healthy",
      value: summary?.healthyServices || 0,
      icon: "fas fa-check-circle",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      textColor: "text-green-600",
    },
    {
      name: "Unhealthy",
      value: summary?.unhealthyServices || 0,
      icon: "fas fa-exclamation-circle",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-600",
    },
    {
      name: "Unknown",
      value: summary?.unknownServices || 0,
      icon: "fas fa-question-circle",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      textColor: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 w-20 bg-slate-200 rounded"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.name} className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 ${stat.bgColor} rounded-full`}>
                <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-600">{stat.name}</p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
