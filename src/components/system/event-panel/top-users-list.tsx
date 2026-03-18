// src/components/system/event-panel/top-users-list.tsx

"use client";

import { Trophy } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TopUserDTO } from "@/lib/actions/types/event-panel-types";

interface TopUsersListProps {
  users: TopUserDTO[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TopUsersList({ users }: TopUsersListProps) {
  const chartData = users.slice(0, 8).map((u) => ({
    name: u.userName.split(" ")[0],
    fullName: u.userName,
    solicitudes: u.requestCount,
  }));

  const chartConfig = {
    solicitudes: {
      label: "Solicitudes",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          Top Usuarios
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Solicitudes por usuario (rol USER)
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {users.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin solicitudes de usuarios
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={
                  <ChartTooltipContent
                    style={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value, _name, item) => [
                      value,
                      " ",
                      item.payload.fullName,
                    ]}
                  />
                }
              />
              <Bar dataKey="solicitudes" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
