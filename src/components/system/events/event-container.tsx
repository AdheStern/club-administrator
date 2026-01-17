// src/components/system/events/event-container.tsx

"use client";

import { Calendar, CalendarCheck, CalendarX, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents } from "@/lib/actions/event-actions";
import { getSectors } from "@/lib/actions/sector-actions";
import { getTables } from "@/lib/actions/table-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { EventList } from "./event-list";
import { EventStatsCard } from "./event-stats-card";

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

export function EventContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [sectors, setSectors] = useState<SectorWithRelations[]>([]);
  const [tables, setTables] = useState<TableWithRelations[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsResult, sectorsResult, tablesResult] = await Promise.all([
        getEvents({}, { pageSize: 1000 }),
        getSectors({}, { pageSize: 1000 }),
        getTables({}, { pageSize: 1000 }),
      ]);

      setEvents(
        eventsResult.success && eventsResult.data?.data
          ? eventsResult.data.data
          : [],
      );
      setSectors(
        sectorsResult.success && sectorsResult.data?.data
          ? sectorsResult.data.data
          : [],
      );
      setTables(
        tablesResult.success && tablesResult.data?.data
          ? tablesResult.data.data
          : [],
      );
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const stats = {
    total: events.length,
    active: events.filter((e) => e.isActive).length,
    upcoming: events.filter((e) => new Date(e.eventDate) > now && e.isActive)
      .length,
    past: events.filter((e) => new Date(e.eventDate) < now).length,
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
            <p className="text-muted-foreground">
              Gestiona los eventos del club
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
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">Gestiona los eventos del club</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <EventStatsCard
          title="Total Eventos"
          value={stats.total}
          description="Eventos registrados"
          icon={Calendar}
        />
        <EventStatsCard
          title="Eventos Activos"
          value={stats.active}
          description={
            stats.total > 0
              ? `${((stats.active / stats.total) * 100).toFixed(0)}% del total`
              : "Sin eventos"
          }
          icon={TrendingUp}
        />
        <EventStatsCard
          title="Próximos Eventos"
          value={stats.upcoming}
          description="Eventos por realizar"
          icon={CalendarCheck}
        />
        <EventStatsCard
          title="Eventos Finalizados"
          value={stats.past}
          description="Eventos pasados"
          icon={CalendarX}
        />
      </div>

      <EventList
        initialEvents={events}
        sectors={sectors}
        tables={tables}
        onRefresh={loadData}
      />
    </div>
  );
}
