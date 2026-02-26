// src/components/system/dashboard/status-distribution.tsx

"use client";

import { LayoutGrid } from "lucide-react";
import { LabelList, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RequestsByStatus } from "@/lib/actions/dashboard-actions";

interface StatusDistributionProps {
  data: RequestsByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  OBSERVED: "#ec4899",
  PRE_APPROVED: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  OBSERVED: "Observada",
  PRE_APPROVED: "Pre-Aprobada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export function StatusDistribution({ data }: StatusDistributionProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.status] = {
      label: STATUS_LABELS[item.status] ?? item.status,
      color: STATUS_COLORS[item.status] ?? "#6366f1",
    };
    return acc;
  }, {} as ChartConfig);

  const chartData = data.map((item) => ({
    status: item.status,
    name: STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
    percentage: item.percentage.toFixed(1),
    fill: STATUS_COLORS[item.status] ?? "#6366f1",
  }));

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Distribución de Solicitudes
        </CardTitle>
        <CardDescription>
          Estado actual de todas las solicitudes registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto min-h-[280px] w-full max-w-[400px]"
        >
          <RadialBarChart
            data={chartData}
            innerRadius={30}
            outerRadius={120}
            startAngle={-90}
            endAngle={270}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  nameKey="name"
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{item.payload.name}</span>
                      <span>
                        {value} solicitudes ({item.payload.percentage}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <RadialBar dataKey="value" background={{ fill: "#1e1e2e" }}>
              <LabelList
                position="insideStart"
                dataKey="name"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={10}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {chartData.map((item) => (
            <div
              key={item.status}
              className="flex items-center gap-2 p-2 rounded-lg border"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value} sol. · {item.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
