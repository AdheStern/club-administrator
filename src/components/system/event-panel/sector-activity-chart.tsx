// src/components/system/event-panel/sector-activity-chart.tsx

"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type {
  SectorActivityDTO,
  SectorAvailabilityDTO,
} from "@/lib/actions/types/event-panel-types";

interface SectorActivityChartProps {
  data: SectorActivityDTO[];
  sectorAvailability: SectorAvailabilityDTO[];
}

const chartConfig = {
  solicitudes: {
    label: "Solicitudes",
    color: "var(--chart-1)",
  },
  ocupacion: {
    label: "Ocupación %",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function SectorActivityChart({
  data = [],
  sectorAvailability = [],
}: SectorActivityChartProps) {
  const availabilityMap = new Map(
    sectorAvailability.map((s) => [s.sectorName, s.occupancyPercent]),
  );

  const chartData = data.map((s) => ({
    sector:
      s.sectorName.length > 12 ? `${s.sectorName.slice(0, 12)}…` : s.sectorName,
    solicitudes: s.requestCount,
    ocupacion: availabilityMap.get(s.sectorName) ?? 0,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-semibold">
            Actividad vs Ocupación por Sector
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex items-center justify-center h-32">
          <p className="text-xs text-muted-foreground">Sin datos de sectores</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length < 3) {
    return (
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-semibold">
            Actividad vs Ocupación por Sector
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {data.map((s) => (
            <div
              key={s.sectorName}
              className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
            >
              <span className="text-xs font-medium truncate">
                {s.sectorName}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span>{s.requestCount} solicitudes</span>
                <span className="text-foreground font-medium">
                  {availabilityMap.get(s.sectorName) ?? 0}% ocupado
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-semibold">
          Actividad vs Ocupación por Sector
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[340px] w-full"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="sector" />
            <PolarGrid />
            <Radar
              dataKey="solicitudes"
              fill="var(--color-solicitudes)"
              fillOpacity={0.5}
              stroke="var(--color-solicitudes)"
            />
            <Radar
              dataKey="ocupacion"
              fill="var(--color-ocupacion)"
              fillOpacity={0.3}
              stroke="var(--color-ocupacion)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
