// src/components/system/dashboard/user-performance-card.tsx
"use client";

import { CheckCircle, Clock, DollarSign, TrendingUp, User } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserPerformance } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface UserPerformanceCardProps {
  data: UserPerformance;
}

export function UserPerformanceCard({ data }: UserPerformanceCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

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
                {data.requestsCreated} solicitudes
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
              <span className="text-xs text-muted-foreground">Tiempo</span>
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
                Últimos 3 Meses
              </span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={chartData}>
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
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    fontSize: "12px",
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill={`url(#gradient-${data.userId})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
