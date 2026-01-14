// src/components/system/sectors/sector-container.tsx

"use client";

import { Building2, Table, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSectors } from "@/lib/actions/sector-actions";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import { SectorList } from "./sector-list";
import { SectorStatsCard } from "./sector-stats-card";

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

export function SectorContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [sectors, setSectors] = useState<SectorWithRelations[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getSectors();

      setSectors(result.success && result.data?.data ? result.data.data : []);
    } catch (error) {
      console.error("Error loading sectors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    total: sectors.length,
    active: sectors.filter((s) => s.isActive).length,
    totalCapacity: sectors.reduce((acc, s) => acc + s.capacity, 0),
    totalTables: sectors.reduce((acc, s) => acc + s._count.tables, 0),
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sectores</h2>
            <p className="text-muted-foreground">
              Gestiona los sectores del club
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
          <h2 className="text-3xl font-bold tracking-tight">Sectores</h2>
          <p className="text-muted-foreground">
            Gestiona los sectores del club
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SectorStatsCard
          title="Total Sectores"
          value={stats.total}
          description="Sectores registrados"
          icon={Building2}
        />
        <SectorStatsCard
          title="Sectores Activos"
          value={stats.active}
          description={
            stats.total > 0
              ? `${((stats.active / stats.total) * 100).toFixed(0)}% del total`
              : "Sin sectores"
          }
          icon={TrendingUp}
        />
        <SectorStatsCard
          title="Capacidad Total"
          value={stats.totalCapacity}
          description="Personas"
          icon={Users}
        />
        <SectorStatsCard
          title="Total Mesas"
          value={stats.totalTables}
          description="En todos los sectores"
          icon={Table}
        />
      </div>

      <SectorList initialSectors={sectors} onRefresh={loadData} />
    </div>
  );
}
