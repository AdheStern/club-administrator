// src/components/system/dashboard/qr-stats-chart.tsx

"use client";

import { Clock, QrCode, ScanLine } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QRStats } from "@/lib/actions/qr-stats-actions";

interface QRStatsChartProps {
  data: QRStats;
}

const SCANNED_COLOR = "hsl(var(--chart-1))";
const PENDING_COLOR = "hsl(var(--chart-2))";

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof QrCode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value.toLocaleString("es-BO")}</p>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold truncate max-w-[200px]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.value.toLocaleString("es-BO")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function QRStatsChart({ data }: QRStatsChartProps) {
  const scannedPct =
    data.total > 0 ? Math.round((data.scanned / data.total) * 100) : 0;

  const chartData = data.byEvent.slice(0, 8).map((ev) => ({
    name:
      ev.eventName.length > 18 ? `${ev.eventName.slice(0, 18)}…` : ev.eventName,
    fullName: ev.eventName,
    Escaneados: ev.scanned,
    Pendientes: ev.pending,
    total: ev.total,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle>Códigos QR</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            icon={QrCode}
            label="Total generados"
            value={data.total}
            color="hsl(var(--primary))"
          />
          <SummaryCard
            icon={ScanLine}
            label="Escaneados"
            value={data.scanned}
            color="hsl(var(--chart-1))"
          />
          <SummaryCard
            icon={Clock}
            label="Pendientes"
            value={data.pending}
            color="hsl(var(--chart-2))"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso de escaneo</span>
            <span className="font-semibold">{scannedPct}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-chart-1 transition-all duration-700"
              style={{ width: `${scannedPct}%` }}
            />
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Por evento (últimos {Math.min(8, data.byEvent.length)})
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Escaneados"
                  stackId="a"
                  fill={SCANNED_COLOR}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Pendientes"
                  stackId="a"
                  fill={PENDING_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
