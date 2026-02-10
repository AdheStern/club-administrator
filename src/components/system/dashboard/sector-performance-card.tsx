// src/components/system/dashboard/sector-performance-card.tsx
"use client";

import { Building2, DollarSign, Percent, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SectorPerformance } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface SectorPerformanceCardProps {
  data: SectorPerformance;
}

export function SectorPerformanceCard({ data }: SectorPerformanceCardProps) {
  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-semibold">{data.sectorName}</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {data.requestCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Ingresos Totales</span>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(data.totalRevenue)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Percent className="h-4 w-4" />
              <span>Tasa de Aprobación</span>
            </div>
            <span className="font-semibold">
              {data.approvalRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.approvalRate} className="h-2" />
        </div>

        <div className="p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Ticket Promedio
            </span>
            <span className="text-sm font-semibold">
              {formatCurrency(data.averageTicket)}
            </span>
          </div>
        </div>

        {data.topTables.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Top Mesas</span>
            </div>
            <div className="space-y-1.5">
              {data.topTables.slice(0, 3).map((table, index) => (
                <div
                  key={table.tableId}
                  className="flex items-center justify-between p-2 rounded border bg-background"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                        index === 0 && "bg-yellow-500 text-white",
                        index === 1 && "bg-gray-400 text-white",
                        index === 2 && "bg-orange-600 text-white",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium">
                      {table.tableName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-600">
                      {formatCurrency(table.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {table.requestCount} sol.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
