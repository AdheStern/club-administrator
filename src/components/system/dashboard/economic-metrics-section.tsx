// src/components/system/dashboard/economic-metrics-section.tsx
"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardStats,
  EconomicMetrics,
} from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface EconomicMetricsSectionProps {
  stats: DashboardStats;
  economicMetrics: EconomicMetrics;
}

const COLORS = ["#10b981", "#60a5fa", "#f59e0b", "#8b5cf6", "#ec4899"];

export function EconomicMetricsSection({
  stats,
  economicMetrics,
}: EconomicMetricsSectionProps) {
  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Métricas Económicas</h2>
      </div>

      <div className="grid gap-6 grid-cols-12 auto-rows-auto">
        <Card className="col-span-12 md:col-span-5 hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Ingresos Totales
              {economicMetrics.revenueGrowth !== 0 && (
                <Badge
                  variant={
                    economicMetrics.revenueGrowth > 0
                      ? "default"
                      : "destructive"
                  }
                  className="gap-1"
                >
                  {economicMetrics.revenueGrowth > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(economicMetrics.revenueGrowth).toFixed(1)}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold tracking-tight text-green-600">
                {formatCurrency(economicMetrics.totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                De {stats.approvedRequests} solicitudes aprobadas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ticket Promedio</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(economicMetrics.averageTicket)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pendiente</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {formatCurrency(economicMetrics.revenueByStatus.pending)}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aprobado</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(economicMetrics.revenueByStatus.approved)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pre-aprobado</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(economicMetrics.revenueByStatus.preApproved)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-7 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos por Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={economicMetrics.revenueBySector.slice(0, 5)}
                layout="vertical"
              >
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                  {economicMetrics.revenueBySector
                    .slice(0, 5)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {economicMetrics.revenueBySector
                .slice(0, 4)
                .map((sector, index) => (
                  <div
                    key={sector.sectorId}
                    className="flex items-center gap-2 p-2 rounded-lg border"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {sector.sectorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(sector.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Embudo de Conversión por Paquete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {economicMetrics.revenueByPackage.map((pkg, index) => {
                const maxRevenue =
                  economicMetrics.revenueByPackage[0]?.revenue || 1;
                const percentage = (pkg.revenue / maxRevenue) * 100;

                return (
                  <div key={pkg.packageId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium truncate">
                          {pkg.packageName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {pkg.requestCount} sol.
                      </span>
                    </div>

                    <div className="relative">
                      <div
                        className="h-12 rounded-lg transition-all flex items-center justify-between px-4"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                          opacity: 0.9,
                          minWidth: "40%",
                        }}
                      >
                        <span className="text-white text-sm font-semibold truncate">
                          {formatCurrency(pkg.revenue)}
                        </span>
                        <span className="text-white text-xs font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {economicMetrics.revenueByPackage.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Percent className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay datos de paquetes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Eventos por Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {economicMetrics.topRevenueEvents.map((event, index) => (
                <div
                  key={event.eventId}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                      index === 0 && "bg-yellow-500 text-white",
                      index === 1 && "bg-gray-400 text-white",
                      index === 2 && "bg-orange-600 text-white",
                      index > 2 && "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.eventName}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.requestCount} solicitudes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(event.revenue)}
                    </p>
                  </div>
                </div>
              ))}

              {economicMetrics.topRevenueEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay datos de eventos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
