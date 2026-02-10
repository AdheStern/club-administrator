// src/components/system/dashboard/operational-metrics-section.tsx
"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardStats,
  PendingRequest,
  RequestsByMonth,
  RequestsByStatus,
  UpcomingEvent,
} from "@/lib/actions/dashboard-actions";
import { PendingRequestsList } from "./pending-requests-list";
import { RequestsChart } from "./requests-chart";
import { StatsCard } from "./stats-card";
import { StatusDistribution } from "./status-distribution";
import { UpcomingEventsCarousel } from "./upcoming-events";

interface OperationalMetricsSectionProps {
  stats: DashboardStats;
  requestsByStatus: RequestsByStatus[];
  requestsByMonth: RequestsByMonth[];
  upcomingEvents: UpcomingEvent[];
  pendingRequests: PendingRequest[];
}

export function OperationalMetricsSection({
  stats,
  requestsByStatus,
  requestsByMonth,
  upcomingEvents,
  pendingRequests,
}: OperationalMetricsSectionProps) {
  const approvalRate =
    stats.totalRequests > 0
      ? (stats.approvedRequests / stats.totalRequests) * 100
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Métricas Operacionales</h2>
      </div>

      <div className="grid gap-6 grid-cols-12 auto-rows-auto">
        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Solicitudes Totales"
            value={stats.totalRequests}
            description="Total registradas"
            icon={Activity}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Pendientes"
            value={stats.pendingRequests}
            description="Requieren revisión"
            icon={Clock}
            className="border-l-4 border-l-yellow-500"
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Aprobadas"
            value={stats.approvedRequests}
            description={`${approvalRate.toFixed(1)}% del total`}
            icon={CheckCircle}
            className="border-l-4 border-l-green-500"
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Clientes Totales"
            value={stats.totalClients}
            description="Registrados"
            icon={Users}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Observadas"
            value={stats.observedRequests}
            description="Con observaciones"
            icon={TrendingDown}
            className="border-l-4 border-l-orange-500"
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Rechazadas"
            value={stats.rejectedRequests}
            description="No aprobadas"
            icon={XCircle}
            className="border-l-4 border-l-red-500"
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Tiempo Promedio"
            value={`${stats.averageApprovalTime.toFixed(1)}h`}
            description="De aprobación"
            icon={Clock}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <StatsCard
            title="Eventos Próximos"
            value={stats.upcomingEvents}
            description={`De ${stats.totalEvents} totales`}
            icon={Activity}
          />
        </div>

        <div className="col-span-12 md:col-span-4">
          <UpcomingEventsCarousel data={upcomingEvents} />
        </div>

        <div className="col-span-12 md:col-span-8">
          <StatusDistribution data={requestsByStatus} />
        </div>

        <div className="col-span-12">
          <RequestsChart data={requestsByMonth} />
        </div>

        <div className="col-span-12">
          <PendingRequestsList data={pendingRequests} />
        </div>
      </div>
    </div>
  );
}
