// src/components/system/user-activity/user-activity-stats.tsx

"use client";

import { Calendar, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ActivityStatsDTO,
  UserActivityRankItem,
} from "@/lib/actions/types/user-activity-types";
import { getActivityStats } from "@/lib/actions/user-activity-stats-actions";

const monthChartConfig: ChartConfig = {
  activityCount: {
    label: "Días con actividad",
    color: "var(--chart-1)",
  },
};

const weekdayChartConfig: ChartConfig = {
  activityCount: {
    label: "Días con actividad",
    color: "var(--chart-2)",
  },
};

function ChartSkeleton() {
  return <Skeleton className="h-48 w-full" />;
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

interface UserRankListProps {
  data: UserActivityRankItem[];
  variant: "top" | "bottom";
}

function UserRankList({ data, variant }: UserRankListProps) {
  const max = Math.max(...data.map((d) => d.activityCount), 1);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.userId} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-4 shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">
                {item.userName}
              </span>
              <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                {item.activityCount} días
              </Badge>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={
                  variant === "top"
                    ? "h-full rounded-full bg-green-500"
                    : "h-full rounded-full bg-orange-500"
                }
                style={{ width: `${(item.activityCount / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserActivityStats() {
  const [stats, setStats] = useState<ActivityStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityStats().then((res) => {
      if (res.success && res.data) setStats(res.data);
      setLoading(false);
    });
  }, []);

  const maxWeekday = stats
    ? Math.max(...stats.byWeekday.map((d) => d.activityCount))
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Usuarios con más actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton />
          ) : stats?.topUsers.length ? (
            <UserRankList data={stats.topUsers} variant="top" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            Usuarios con menos actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton />
          ) : stats?.bottomUsers.length ? (
            <UserRankList data={stats.bottomUsers} variant="bottom" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--chart-1)]" />
            Actividad por mes (últimos 12)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ChartSkeleton />
          ) : stats?.byMonth.length ? (
            <ChartContainer
              config={monthChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart
                data={stats.byMonth}
                margin={{ left: 0, right: 8, top: 4, bottom: 28 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="activityCount"
                  fill="var(--color-activityCount)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--chart-2)]" />
            Actividad por día de la semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ChartSkeleton />
          ) : stats?.byWeekday.length ? (
            <ChartContainer
              config={weekdayChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart
                data={stats.byWeekday}
                margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="activityCount" radius={[4, 4, 0, 0]}>
                  {stats.byWeekday.map((entry, i) => (
                    <Cell
                      key={i}
                      fill="var(--color-activityCount)"
                      fillOpacity={entry.activityCount === maxWeekday ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
