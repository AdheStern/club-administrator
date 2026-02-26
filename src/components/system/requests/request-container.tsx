// src/components/system/requests/request-container.tsx
"use client";

import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents } from "@/lib/actions/event-actions";
import { getRequestsByUserRole } from "@/lib/actions/request-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsResult, eventsResult] = await Promise.all([
        getRequestsByUserRole(userId, userRole, {}, { pageSize: 1000 }),
        getEvents({}, { pageSize: 1000 }),
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
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole]);

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
      <div className="flex-1 space-y-4 px-3 py-4 md:px-8 md:py-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Solicitudes
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestiona las solicitudes de mesas
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-3 py-4 md:px-8 md:py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Solicitudes
        </h2>
        <p className="text-muted-foreground text-sm">
          Gestiona las solicitudes de mesas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <RequestStatsCard
          title="Total"
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
          description="Confirmadas"
          icon={CheckCircle}
          className="border-green-200"
        />
        <RequestStatsCard
          title="Rechazadas"
          value={stats.rejected}
          description="Denegadas"
          icon={XCircle}
          className="border-red-200"
        />
      </div>

      <RequestList
        initialRequests={requests}
        events={events}
        userId={userId}
        userRole={userRole}
        onRefresh={loadData}
      />
    </div>
  );
}
