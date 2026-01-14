// src/components/system/dashboard/dashboard-container.tsx

"use client";

import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type DashboardStats,
  getDashboardData,
  type PendingRequest,
  type RequestsByMonth,
  type RequestsByStatus,
  type TopClient,
  type UpcomingEvent,
} from "@/lib/actions/dashboard-actions";
import { PendingRequestsList } from "./pending-requests-list";
import { RequestsChart } from "./requests-chart";
import { StatsCard } from "./stats-card";
import { StatusDistribution } from "./status-distribution";
import { TopClientsTable } from "./top-clients-table";
import { UpcomingEvents } from "./upcoming-events";

export function DashboardContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requestsByStatus, setRequestsByStatus] = useState<RequestsByStatus[]>(
    []
  );
  const [requestsByMonth, setRequestsByMonth] = useState<RequestsByMonth[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const result = await getDashboardData();

      if (result.success && result.data) {
        setStats(result.data.stats);
        setRequestsByStatus(result.data.requestsByStatus);
        setRequestsByMonth(result.data.requestsByMonth);
        setTopClients(result.data.topClients);
        setUpcomingEvents(result.data.upcomingEvents);
        setPendingRequests(result.data.pendingRequests);
      } else {
        toast.error(result.error || "Error al cargar datos del dashboard");
      }
    } catch (error) {
      toast.error("Error inesperado al cargar el dashboard");
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Error al cargar el dashboard</p>
          <p className="text-sm text-muted-foreground mt-2">
            Por favor, intenta recargar la página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Solicitudes"
          value={stats.totalRequests}
          description="Todas las solicitudes registradas"
          icon={Activity}
        />
        <StatsCard
          title="Solicitudes Pendientes"
          value={stats.pendingRequests}
          description={`${stats.observedRequests} observadas`}
          icon={Clock}
          className="border-yellow-200 bg-yellow-50/50"
        />
        <StatsCard
          title="Solicitudes Aprobadas"
          value={stats.approvedRequests}
          description="Confirmadas y activas"
          icon={CheckCircle}
          className="border-green-200 bg-green-50/50"
        />
        <StatsCard
          title="Revenue Total"
          value={formatCurrency(stats.totalRevenue)}
          description="De solicitudes aprobadas"
          icon={DollarSign}
          className="border-blue-200 bg-blue-50/50"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Eventos Totales"
          value={stats.totalEvents}
          description={`${stats.upcomingEvents} próximos`}
          icon={Calendar}
        />
        <StatsCard
          title="Clientes Registrados"
          value={stats.totalClients}
          description="Total de invitados"
          icon={Users}
        />
        <StatsCard
          title="Tiempo de Aprobación"
          value={formatTime(stats.averageApprovalTime)}
          description="Promedio de revisión"
          icon={TrendingUp}
        />
        <StatsCard
          title="Solicitudes Rechazadas"
          value={stats.rejectedRequests}
          description="No aprobadas"
          icon={XCircle}
          className="border-red-200 bg-red-50/50"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <RequestsChart data={requestsByMonth} />
        <StatusDistribution data={requestsByStatus} />
      </div>

      {/* Tables */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <TopClientsTable data={topClients} />
        <UpcomingEvents data={upcomingEvents} />
      </div>

      {/* Pending Requests */}
      <div className="grid gap-4 grid-cols-1">
        <PendingRequestsList data={pendingRequests} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Secondary Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Skeleton className="h-[400px] col-span-4" />
        <Skeleton className="h-[400px] col-span-3" />
      </div>

      {/* Tables Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Skeleton className="h-[400px] col-span-4" />
        <Skeleton className="h-[400px] col-span-3" />
      </div>

      {/* Pending Requests Skeleton */}
      <Skeleton className="h-[400px]" />
    </div>
  );
}
