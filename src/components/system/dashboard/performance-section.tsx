// src/components/system/dashboard/performance-section.tsx
"use client";

import { Award, BarChart3, TrendingUp } from "lucide-react";
import type {
  SectorPerformance,
  TopClient,
  UserPerformance,
} from "@/lib/actions/dashboard-actions";
import { SectorPerformanceCard } from "./sector-performance-card";
import { TopClientsTable } from "./top-clients-table";
import { UserPerformanceCard } from "./user-performance-card";

interface PerformanceSectionProps {
  sectorPerformance: SectorPerformance[];
  userPerformance: UserPerformance[];
  topClients: TopClient[];
}

export function PerformanceSection({
  sectorPerformance,
  userPerformance,
  topClients,
}: PerformanceSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Rendimiento y Análisis</h2>
      </div>

      <div className="grid gap-6 grid-cols-12 auto-rows-auto">
        <div className="col-span-12 md:col-span-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Rendimiento por Sector</h3>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {sectorPerformance.slice(0, 4).map((sector) => (
              <SectorPerformanceCard key={sector.sectorId} data={sector} />
            ))}
          </div>

          {sectorPerformance.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <BarChart3 className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p>No hay datos de rendimiento por sector</p>
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Top Clientes</h3>
          </div>
          <TopClientsTable data={topClients} />
        </div>

        <div className="col-span-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Rendimiento de Usuarios</h3>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {userPerformance.slice(0, 6).map((user) => (
              <UserPerformanceCard key={user.userId} data={user} />
            ))}
          </div>

          {userPerformance.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <TrendingUp className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p>No hay datos de rendimiento de usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
