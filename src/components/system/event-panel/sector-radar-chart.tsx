// src/components/system/event-panel/sector-radar-chart.tsx

"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SectorRadarDTO } from "@/lib/actions/types/event-panel-types";

interface SectorRadarChartProps {
  data: SectorRadarDTO[];
}

const chartConfig = {
  solicitudes: {
    label: "Solicitudes",
    color: "hsl(var(--chart-1))",
  },
  ocupacion: {
    label: "Ocupación %",
    color: "hsl(var(--chart-2))",
  },
  aprobadas: {
    label: "Tasa Aprob. %",
    color: "hsl(var(--chart-3))",
  },
};

export function SectorRadarChart({ data }: SectorRadarChartProps) {
  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold">
          Rendimiento por Sector
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Solicitudes · Ocupación · Tasa de aprobación
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin datos de sectores
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <RadarChart data={data}>
              <PolarGrid gridType="circle" />
              <PolarAngleAxis dataKey="sectorName" tick={{ fontSize: 11 }} />
              <Radar
                dataKey="solicitudes"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.25}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
              />
              <Radar
                dataKey="ocupacion"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.25}
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--chart-2))" }}
              />
              <Radar
                dataKey="aprobadas"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.25}
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--chart-3))" }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    style={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
