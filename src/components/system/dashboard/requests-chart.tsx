// src/components/system/dashboard/requests-chart.tsx
"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequestsByMonth } from "@/lib/actions/dashboard-actions";

interface RequestsChartProps {
  data: RequestsByMonth[];
}

export function RequestsChart({ data }: RequestsChartProps) {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Solicitudes por Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              name="Total"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="approved"
              name="Aprobadas"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="rejected"
              name="Rechazadas"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
