// src/components/system/tables/table-container.tsx

"use client";

import {
  Building2,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSectors } from "@/lib/actions/sector-actions";
import { getTables } from "@/lib/actions/table-actions";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { TableList } from "./table-list";
import { TableStatsCard } from "./table-stats-card";

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

export function TableContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<TableWithRelations[]>([]);
  const [sectors, setSectors] = useState<SectorWithRelations[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tablesResult, sectorsResult] = await Promise.all([
        getTables({}, { pageSize: 1000 }),
        getSectors({}, { pageSize: 1000 }),
      ]);

      setTables(
        tablesResult.success && tablesResult.data?.data
          ? tablesResult.data.data
          : [],
      );
      setSectors(
        sectorsResult.success && sectorsResult.data?.data
          ? sectorsResult.data.data
          : [],
      );
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    total: tables.length,
    active: tables.filter((t) => t.isActive).length,
    totalCapacity: tables.reduce((acc, t) => acc + t.capacity, 0),
    vipTables: tables.filter((t) => t.tableType === "VIP").length,
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mesas</h2>
            <p className="text-muted-foreground">Gestiona las mesas del club</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Mesas</h2>
          <p className="text-muted-foreground">Gestiona las mesas del club</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <TableStatsCard
          title="Total Mesas"
          value={stats.total}
          description="Mesas registradas"
          icon={TableIcon}
        />
        <TableStatsCard
          title="Mesas Activas"
          value={stats.active}
          description={
            stats.total > 0
              ? `${((stats.active / stats.total) * 100).toFixed(0)}% del total`
              : "Sin mesas"
          }
          icon={TrendingUp}
        />
        <TableStatsCard
          title="Capacidad Total"
          value={stats.totalCapacity}
          description="Personas"
          icon={Building2}
        />
        <TableStatsCard
          title="Mesas VIP"
          value={stats.vipTables}
          description={`${stats.vipTables} de ${stats.total} mesas`}
          icon={LayoutGrid}
        />
      </div>

      <TableList
        initialTables={tables}
        sectors={sectors}
        onRefresh={loadData}
      />
    </div>
  );
}
