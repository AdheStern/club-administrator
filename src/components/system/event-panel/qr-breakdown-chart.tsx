// src/components/system/event-panel/qr-breakdown-chart.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { QRByPackageDTO } from "@/lib/actions/types/event-panel-types";

interface QRBreakdownChartProps {
  data: QRByPackageDTO[];
}

const PALETTE = [
  "bg-[hsl(var(--chart-1))]",
  "bg-[hsl(var(--chart-2))]",
  "bg-[hsl(var(--chart-3))]",
  "bg-[hsl(var(--chart-4))]",
  "bg-[hsl(var(--chart-5))]",
];

const PROGRESS_COLORS = [
  "[&>div]:bg-[hsl(var(--chart-1))]",
  "[&>div]:bg-[hsl(var(--chart-2))]",
  "[&>div]:bg-[hsl(var(--chart-3))]",
  "[&>div]:bg-[hsl(var(--chart-4))]",
  "[&>div]:bg-[hsl(var(--chart-5))]",
];

export function QRBreakdownChart({ data = [] }: QRBreakdownChartProps) {
  const sorted = [...data]
    .filter((d) => d.regularCount + d.invitationCount > 0)
    .sort(
      (a, b) =>
        b.regularCount +
        b.invitationCount -
        (a.regularCount + a.invitationCount),
    );

  const max = sorted[0]
    ? sorted[0].regularCount + sorted[0].invitationCount
    : 1;

  if (sorted.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-semibold">
            QR por Paquete
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex items-center justify-center h-32">
          <p className="text-xs text-muted-foreground">Sin QR generados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-semibold">QR por Paquete</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3 overflow-y-auto">
        {sorted.map((pkg, i) => {
          const total = pkg.regularCount + pkg.invitationCount;
          const pct = Math.round((total / max) * 100);
          return (
            <div key={pkg.packageId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${PALETTE[i % PALETTE.length]}`}
                  />
                  <span className="text-xs font-medium truncate">
                    {pkg.packageName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pkg.isInvitation && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      Invitación
                    </Badge>
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {total}
                  </span>
                </div>
              </div>
              <Progress
                value={pct}
                className={`h-2 ${PROGRESS_COLORS[i % PROGRESS_COLORS.length]}`}
              />
              {(pkg.regularCount > 0 || pkg.invitationCount > 0) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {pkg.regularCount > 0 && (
                    <span>{pkg.regularCount} regulares</span>
                  )}
                  {pkg.invitationCount > 0 && (
                    <span>{pkg.invitationCount} invitación</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
