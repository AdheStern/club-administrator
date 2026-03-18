// src/components/system/event-panel/kpi-row.tsx

"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { EventPanelKPIs } from "@/lib/actions/types/event-panel-types";

interface RadialKpiCardProps {
  label: string;
  valueLine1: string;
  valueLine2?: string;
  pct: number;
  colorKey: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
  badge?: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}

function RadialKpiCard({
  label,
  valueLine1,
  valueLine2,
  pct,
  colorKey,
  badge,
}: RadialKpiCardProps) {
  const safePct = Math.min(100, Math.max(0, pct));
  const chartData = [
    { name: label, value: safePct, fill: "var(--color-value)" },
  ];
  const chartConfig = {
    value: { label, color: `var(--${colorKey})` },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardContent className="p-3 flex flex-col items-center gap-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[160px] w-full"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={safePct * 3.6}
            innerRadius={55}
            outerRadius={75}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[60, 48]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-bold"
                          style={{ fontSize: 18 }}
                        >
                          {safePct}%
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
        <p className="text-xs text-muted-foreground text-center leading-tight">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground">{valueLine1}</p>
        {valueLine2 && (
          <p className="text-xs text-muted-foreground">{valueLine2}</p>
        )}
        {badge && (
          <Badge variant={badge.variant} className="text-xs px-1.5 py-0">
            {badge.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

interface SimpleKpiCardProps {
  label: string;
  value: string;
  sub?: string;
}

function SimpleKpiCard({ label, value, sub }: SimpleKpiCardProps) {
  return (
    <Card>
      <CardContent className="p-3 flex flex-col justify-center h-full min-h-[220px]">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-2xl font-bold leading-tight mt-2 text-foreground">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

interface KpiRowProps {
  kpis: EventPanelKPIs;
  paymentConversionRate: number;
  overallOccupancy: number;
}

export function KpiRow({
  kpis,
  paymentConversionRate,
  overallOccupancy,
}: KpiRowProps) {
  const avgApproval =
    kpis.avgApprovalMinutes !== null
      ? kpis.avgApprovalMinutes < 60
        ? `${Math.round(kpis.avgApprovalMinutes)}m`
        : `${(kpis.avgApprovalMinutes / 60).toFixed(1)}h`
      : "—";

  const convBadge =
    paymentConversionRate >= 80
      ? { label: "Bueno", variant: "default" as const }
      : paymentConversionRate >= 50
        ? { label: "Normal", variant: "secondary" as const }
        : { label: "Bajo", variant: "destructive" as const };

  const scanPct =
    kpis.totalQRGenerated > 0
      ? Math.round((kpis.totalQRScanned / kpis.totalQRGenerated) * 100)
      : 0;

  return (
    <div className="grid grid-cols-4 gap-3">
      <RadialKpiCard
        label="Reservas Aprobadas"
        valueLine1={String(kpis.approvedRequests)}
        valueLine2="solicitudes aprobadas"
        pct={kpis.approvedRequests > 0 ? 100 : 0}
        colorKey="chart-4"
      />
      <RadialKpiCard
        label="Escaneo QR"
        valueLine1={`${kpis.totalQRScanned} / ${kpis.totalQRGenerated}`}
        valueLine2={`${kpis.totalQRPending} pendientes`}
        pct={scanPct}
        colorKey="chart-1"
      />
      <RadialKpiCard
        label="Conversión Pago"
        valueLine1={`${paymentConversionRate}%`}
        pct={paymentConversionRate}
        colorKey="chart-2"
        badge={convBadge}
      />
      <RadialKpiCard
        label="Ocupación Mesas"
        valueLine1={`${overallOccupancy}%`}
        pct={overallOccupancy}
        colorKey="chart-3"
      />
    </div>
  );
}
