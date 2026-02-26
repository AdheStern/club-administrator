// src/components/system/dashboard/economic-metrics-section.tsx

"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type {
  DashboardStats,
  EconomicMetrics,
} from "@/lib/actions/dashboard-actions";

interface EconomicMetricsSectionProps {
  stats: DashboardStats;
  economicMetrics: EconomicMetrics;
}

const SECTOR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];

export function EconomicMetricsSection({
  stats,
  economicMetrics,
}: EconomicMetricsSectionProps) {
  const formatCurrency = (value: number) =>
    `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatCurrencyShort = (value: number) =>
    `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const sectorData = economicMetrics.revenueBySector
    .slice(0, 5)
    .map((s, i) => ({
      name: s.sectorName,
      revenue: s.revenue,
      fill: SECTOR_COLORS[i % SECTOR_COLORS.length],
    }));

  const sectorChartConfig = sectorData.reduce(
    (acc, sector, i) => {
      acc[`sector_${i}`] = {
        label: sector.name,
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      };
      return acc;
    },
    { revenue: { label: "Ingresos" } } as ChartConfig,
  );

  const maxPackageRevenue = economicMetrics.revenueByPackage[0]?.revenue || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Métricas Económicas</h2>
      </div>

      <div className="grid gap-6 grid-cols-12 auto-rows-auto">
        {/* Ingresos Totales */}
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

        {/* Ingresos por Sector — BarChart horizontal con shadcn */}
        <Card className="col-span-12 md:col-span-7 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos por Sector
            </CardTitle>
            <CardDescription>Top 5 sectores por ingreso total</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={sectorChartConfig}
              className="min-h-[220px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={sectorData}
                layout="vertical"
                margin={{ left: 0, right: 60, top: 4, bottom: 4 }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={80}
                  tickFormatter={(v: string) =>
                    v.length > 10 ? `${v.slice(0, 10)}…` : v
                  }
                />
                <XAxis dataKey="revenue" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrencyShort(value as number),
                        "Ingresos",
                      ]}
                      hideLabel
                    />
                  }
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="revenue"
                    position="right"
                    fontSize={11}
                    formatter={(v: number) => formatCurrencyShort(v)}
                    className="fill-foreground"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Funnel por Paquete */}
        <Card className="col-span-12 md:col-span-6 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Embudo de Conversión por Paquete
            </CardTitle>
            <CardDescription>
              Ingresos relativos entre paquetes disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {economicMetrics.revenueByPackage.map((pkg, index) => {
                const percentage = (pkg.revenue / maxPackageRevenue) * 100;
                const color = SECTOR_COLORS[index % SECTOR_COLORS.length];

                return (
                  <div key={pkg.packageId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium truncate max-w-[140px]">
                          {pkg.packageName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {pkg.requestCount} sol.
                      </span>
                    </div>

                    <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center justify-between px-3 transition-all duration-500"
                        style={{
                          width: `${Math.max(percentage, 15)}%`,
                          backgroundColor: color,
                        }}
                      >
                        <span className="text-white text-xs font-semibold truncate">
                          {formatCurrencyShort(pkg.revenue)}
                        </span>
                        <span className="text-white text-xs font-medium ml-1 shrink-0">
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

        {/* Top Eventos */}
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
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}
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
                      {formatCurrencyShort(event.revenue)}
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
