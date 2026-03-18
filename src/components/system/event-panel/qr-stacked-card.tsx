// src/components/system/event-panel/qr-stacked-card.tsx

"use client";

import { Clock, ScanLine } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface QRStackedCardProps {
  title: string;
  total: number;
  scanned: number;
  pending: number;
  colorScanned: "chart-1" | "chart-2" | "chart-3";
  colorPending: "chart-4" | "chart-5";
}

export function QRStackedCard({
  title,
  total,
  scanned,
  pending,
  colorScanned,
  colorPending,
}: QRStackedCardProps) {
  const chartData = [{ scanned, pending }];

  const chartConfig = {
    scanned: { label: "Escaneados", color: `var(--${colorScanned})` },
    pending: { label: "Pendientes", color: `var(--${colorPending})` },
  } satisfies ChartConfig;

  const scanPct = total > 0 ? Math.round((scanned / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex flex-col items-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[260px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={140}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 18}
                          className="fill-foreground font-bold"
                          style={{ fontSize: 28 }}
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 4}
                          className="fill-muted-foreground"
                          style={{ fontSize: 12 }}
                        >
                          {scanPct}% escaneado
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="scanned"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-scanned)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="pending"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-pending)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>

        <div className="flex gap-6 -mt-4">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Escaneados</span>
            </div>
            <span className="text-lg font-bold text-foreground">{scanned}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <span className="text-lg font-bold text-foreground">{pending}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
