// src/components/system/requests/request-container.tsx

"use client";

import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents } from "@/lib/actions/event-actions";
import { getPackages } from "@/lib/actions/package-actions";
import { getRequests } from "@/lib/actions/request-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import { RequestList } from "./request-list";
import { RequestStatsCard } from "./request-stats-card";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface RequestContainerProps {
  userId: string;
  userRole: string;
}

export function RequestContainer({ userId, userRole }: RequestContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsResult, eventsResult, packagesResult] = await Promise.all([
        getRequests({}, { pageSize: 1000 }),
        getEvents({}, { pageSize: 1000 }),
        getPackages({}, { pageSize: 1000 }),
      ]);

      setRequests(
        requestsResult.success && requestsResult.data?.data
          ? requestsResult.data.data
          : [],
      );
      setEvents(
        eventsResult.success && eventsResult.data?.data
          ? eventsResult.data.data
          : [],
      );
      setPackages(
        packagesResult.success && packagesResult.data?.data
          ? packagesResult.data.data
          : [],
      );
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Solicitudes</h2>
            <p className="text-muted-foreground">
              Gestiona las solicitudes de mesas
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Solicitudes</h2>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de mesas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <RequestStatsCard
          title="Total Solicitudes"
          value={stats.total}
          description="Solicitudes registradas"
          icon={FileText}
        />
        <RequestStatsCard
          title="Pendientes"
          value={stats.pending}
          description="Esperando revisión"
          icon={Clock}
          className="border-yellow-200"
        />
        <RequestStatsCard
          title="Aprobadas"
          value={stats.approved}
          description="Solicitudes confirmadas"
          icon={CheckCircle}
          className="border-green-200"
        />
        <RequestStatsCard
          title="Rechazadas"
          value={stats.rejected}
          description="Solicitudes denegadas"
          icon={XCircle}
          className="border-red-200"
        />
      </div>

      <RequestList
        initialRequests={requests}
        events={events}
        packages={packages}
        userId={userId}
        userRole={userRole}
        onRefresh={loadData}
      />
    </div>
  );
}
