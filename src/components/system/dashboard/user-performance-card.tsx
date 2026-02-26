// src/components/system/dashboard/user-performance-card.tsx

"use client";

import { CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Area, AreaChart, XAxis } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import type { UserPerformance } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface UserPerformanceCardProps {
  data: UserPerformance;
}

const revenueChartConfig = {
  revenue: {
    label: "Ingresos",
    color: "#6366f1",
  },
} satisfies ChartConfig;

export function UserPerformanceCard({ data }: UserPerformanceCardProps) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatCurrency = (value: number) =>
    `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const getResponseTimeColor = (hours: number) => {
    if (hours <= 12) return "text-green-600";
    if (hours <= 24) return "text-yellow-600";
    return "text-red-600";
  };

  const chartData = data.revenueByMonth.slice(-3);

  return (
    <Card className="hover:shadow-lg transition-all overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(data.userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none">
                {data.userName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.requestsCreated} solicitudes creadas
              </p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">
              Total Generado
            </span>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(data.totalRevenue)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-muted-foreground">Aprobadas</span>
            </div>
            <p className="text-lg font-bold">{data.requestsApproved}</p>
          </div>

          <div className="p-2 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                T. Respuesta
              </span>
            </div>
            <p
              className={cn(
                "text-lg font-bold",
                getResponseTimeColor(data.avgResponseTime),
              )}
            >
              {data.avgResponseTime.toFixed(1)}h
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasa de Aprobación</span>
            <span className="font-semibold">
              {data.approvalRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.approvalRate} className="h-2" />
        </div>

        {chartData.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Ingresos — Últimos 3 Meses
              </span>
            </div>
            <ChartContainer
              config={revenueChartConfig}
              className="min-h-[80px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`gradient-${data.userId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickMargin={4}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Ingresos",
                      ]}
                      hideLabel
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill={`url(#gradient-${data.userId})`}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
