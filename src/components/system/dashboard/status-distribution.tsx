// src/components/system/dashboard/status-distribution.tsx

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequestsByStatus } from "@/lib/actions/dashboard-actions";

interface StatusDistributionProps {
  data: RequestsByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  OBSERVED: "#fb923c",
  APPROVED: "#34d399",
  REJECTED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  OBSERVED: "Observada",
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
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Distribución de Solicitudes</CardTitle>
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
              outerRadius={80}
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
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_COLORS[data[index].status] || STATUS_COLORS.PENDING,
                }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
