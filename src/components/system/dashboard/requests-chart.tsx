// src/components/system/dashboard/requests-chart.tsx

"use client";

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
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Solicitudes por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
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
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Total"
              fill="#8884d8"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="approved"
              name="Aprobadas"
              fill="#82ca9d"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="rejected"
              name="Rechazadas"
              fill="#ff6b6b"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
