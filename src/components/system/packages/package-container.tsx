// src/components/system/packages/package-container.tsx

"use client";

import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPackages } from "@/lib/actions/package-actions";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import { PackageList } from "./package-list";
import { PackageStatsCard } from "./package-stats-card";

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

export function PackageContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PackageWithRelations[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPackages({}, { pageSize: 1000 });
      setPackages(result.success && result.data?.data ? result.data.data : []);
    } catch (error) {
      console.error("Error loading packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: packages.length,
    active: packages.filter((p) => p.isActive).length,
    totalCapacity: packages.reduce((acc, p) => acc + p.includedPeople, 0),
    avgPrice:
      packages.length > 0
        ? packages.reduce((acc, p) => acc + Number(p.basePrice), 0) /
          packages.length
        : 0,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Paquetes</h2>
            <p className="text-muted-foreground">
              Gestiona los paquetes del club
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
          <h2 className="text-3xl font-bold tracking-tight">Paquetes</h2>
          <p className="text-muted-foreground">
            Gestiona los paquetes del club
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <PackageStatsCard
          title="Total Paquetes"
          value={stats.total}
          description="Paquetes registrados"
          icon={Package}
        />
        <PackageStatsCard
          title="Paquetes Activos"
          value={stats.active}
          description={
            stats.total > 0
              ? `${((stats.active / stats.total) * 100).toFixed(0)}% del total`
              : "Sin paquetes"
          }
          icon={TrendingUp}
        />
        <PackageStatsCard
          title="Capacidad Total"
          value={stats.totalCapacity}
          description="Personas en todos los paquetes"
          icon={Users}
        />
        <PackageStatsCard
          title="Precio Promedio"
          value={formatPrice(stats.avgPrice)}
          description="Precio base promedio"
          icon={DollarSign}
        />
      </div>

      <PackageList initialPackages={packages} onRefresh={loadData} />
    </div>
  );
}
