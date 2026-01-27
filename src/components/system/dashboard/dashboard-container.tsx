// src/components/system/dashboard/dashboard-container.tsx

// src/components/system/dashboard/dashboard-container.tsx
"use client";

import {
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  Users,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardFilters,
  DashboardStats,
  FilterOptions,
  getDashboardData,
  PendingRequest,
  RequestsByMonth,
  RequestsByStatus,
  TopClient,
  UpcomingEvent,
  UserPerformance as UserPerformanceType,
} from "@/lib/actions/dashboard-actions";
import { DashboardFiltersComponent } from "./dashboard-filters";
import { PendingRequestsList } from "./pending-requests-list";
import { RequestsChart } from "./requests-chart";
import { StatsCard } from "./stats-card";
import { StatusDistribution } from "./status-distribution";
import { TopClientsTable } from "./top-clients-table";
import { UpcomingEventsCarousel } from "./upcoming-events";
import { UserPerformance } from "./user-performance";

interface DashboardContainerProps {
  initialData: {
    stats: DashboardStats;
    requestsByStatus: RequestsByStatus[];
    requestsByMonth: RequestsByMonth[];
    topClients: TopClient[];
    upcomingEvents: UpcomingEvent[];
    pendingRequests: PendingRequest[];
    userPerformance: UserPerformanceType[];
    filterOptions: FilterOptions;
  };
  getDashboardDataAction: typeof getDashboardData;
}

export function DashboardContainer({
  initialData,
  getDashboardDataAction,
}: DashboardContainerProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [isPending, startTransition] = useTransition();

  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);

    startTransition(async () => {
      const result = await getDashboardDataAction(newFilters);
      if (result.success) {
        setData(result.data);
      }
    });
  };

  const approvalRate =
    data.stats.totalRequests > 0
      ? (data.stats.approvedRequests / data.stats.totalRequests) * 100
      : 0;

  if (isPending) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <DashboardFiltersComponent
          filters={filters}
          options={data.filterOptions}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Solicitudes Totales"
          value={data.stats.totalRequests}
          description="Total registradas"
          icon={Activity}
        />

        <StatsCard
          title="Pendientes"
          value={data.stats.pendingRequests}
          description="Requieren revisión"
          icon={Clock}
          className="border-l-4 border-l-yellow-500"
        />

        <StatsCard
          title="Aprobadas"
          value={data.stats.approvedRequests}
          description={`${approvalRate.toFixed(1)}% del total`}
          icon={CheckCircle}
          className="border-l-4 border-l-green-500"
        />

        <StatsCard
          title="Ingresos"
          value={`Bs. ${data.stats.totalRevenue.toLocaleString("es-BO", { minimumFractionDigits: 2 })}`}
          description="Total recaudado"
          icon={DollarSign}
          className="border-l-4 border-l-blue-500"
        />

        <StatsCard
          title="Observadas"
          value={data.stats.observedRequests}
          description="Con observaciones"
          icon={TrendingDown}
          className="border-l-4 border-l-orange-500"
        />

        <StatsCard
          title="Rechazadas"
          value={data.stats.rejectedRequests}
          description="No aprobadas"
          icon={XCircle}
          className="border-l-4 border-l-red-500"
        />

        <StatsCard
          title="Tiempo Promedio"
          value={`${data.stats.averageApprovalTime.toFixed(1)}h`}
          description="De aprobación"
          icon={Clock}
        />

        <StatsCard
          title="Clientes Totales"
          value={data.stats.totalClients}
          description="Registrados"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <UpcomingEventsCarousel data={data.upcomingEvents} />
        <StatusDistribution data={data.requestsByStatus} />
      </div>

      <RequestsChart data={data.requestsByMonth} />

      <div className="grid gap-6 md:grid-cols-2">
        <PendingRequestsList data={data.pendingRequests} />
        <TopClientsTable data={data.topClients} />
      </div>

      <UserPerformance data={data.userPerformance} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Skeleton className="h-96 col-span-3" />
        <Skeleton className="h-96 col-span-4" />
      </div>

      <Skeleton className="h-96" />

      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>

      <Skeleton className="h-96" />
    </div>
  );
}
