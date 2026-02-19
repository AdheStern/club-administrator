// src/components/system/dashboard/status-distribution.tsx
"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequestsByStatus } from "@/lib/actions/dashboard-actions";

interface StatusDistributionProps {
  data: RequestsByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  OBSERVED: "#fb923c",
  PRE_APPROVED: "#60a5fa",
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
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Distribución de Solicitudes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STATUS_COLORS[data[index].status] || STATUS_COLORS.PENDING
                  }
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                padding: "12px",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontWeight: "600",
                marginBottom: "8px",
              }}
              itemStyle={{
                color: "hsl(var(--foreground))",
                padding: "4px 0",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg border"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    STATUS_COLORS[data[index].status] || STATUS_COLORS.PENDING,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value} solicitudes
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
