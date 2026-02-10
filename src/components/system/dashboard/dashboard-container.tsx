// src/components/system/dashboard/dashboard-container.tsx
"use client";

import { useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardFilters,
  getDashboardData,
} from "@/lib/actions/dashboard-actions";
import { DashboardFiltersComponent } from "./dashboard-filters";
import { EconomicMetricsSection } from "./economic-metrics-section";
import { OperationalMetricsSection } from "./operational-metrics-section";
import { PerformanceSection } from "./performance-section";

interface DashboardContainerProps {
  initialData: Awaited<ReturnType<typeof getDashboardData>>["data"];
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

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-end">
        <DashboardFiltersComponent
          filters={filters}
          options={data.filterOptions}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <EconomicMetricsSection
        stats={data.stats}
        economicMetrics={data.economicMetrics}
      />

      <OperationalMetricsSection
        stats={data.stats}
        requestsByStatus={data.requestsByStatus}
        requestsByMonth={data.requestsByMonth}
        upcomingEvents={data.upcomingEvents}
        pendingRequests={data.pendingRequests}
      />

      <PerformanceSection
        sectorPerformance={data.sectorPerformance}
        userPerformance={data.userPerformance}
        topClients={data.topClients}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-end">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 auto-rows-auto">
        <div className="grid gap-6 grid-cols-12">
          <Skeleton className="h-[200px] col-span-12 md:col-span-4" />
          <Skeleton className="h-[200px] col-span-12 md:col-span-4" />
          <Skeleton className="h-[200px] col-span-12 md:col-span-4" />
        </div>

        <div className="grid gap-6 grid-cols-12">
          <Skeleton className="h-[400px] col-span-12 md:col-span-5" />
          <Skeleton className="h-[400px] col-span-12 md:col-span-7" />
        </div>

        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}
