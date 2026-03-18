// src/components/system/event-panel/sector-availability.tsx

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SectorAvailabilityDTO } from "@/lib/actions/types/event-panel-types";

interface SectorAvailabilityProps {
  sectors: SectorAvailabilityDTO[];
}

function getStatusConfig(occupancyPercent: number, freeTables: number) {
  if (freeTables === 0) {
    return {
      label: "Sold Out",
      variant: "destructive" as const,
      dot: "bg-red-500",
    };
  }
  if (occupancyPercent >= 80) {
    return {
      label: "Casi lleno",
      variant: "secondary" as const,
      dot: "bg-yellow-500",
    };
  }
  return {
    label: "Disponible",
    variant: "outline" as const,
    dot: "bg-green-500",
  };
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "[&>div]:bg-red-500";
  if (pct >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-green-500";
}

export function SectorAvailability({ sectors }: SectorAvailabilityProps) {
  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold">
          Disponibilidad por Sector
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mesas libres vs reservadas
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-3">
        {sectors.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin datos de sectores
          </p>
        )}
        {sectors.map((sector) => {
          const status = getStatusConfig(
            sector.occupancyPercent,
            sector.freeTables,
          );
          return (
            <div key={sector.sectorId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${status.dot}`}
                  />
                  <span className="text-sm font-medium truncate">
                    {sector.sectorName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {sector.freeTables}/{sector.totalTables} libres
                  </span>
                  <Badge
                    variant={status.variant}
                    className="text-xs px-1.5 py-0"
                  >
                    {status.label}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={sector.occupancyPercent}
                  className={`h-2 flex-1 ${getProgressColor(sector.occupancyPercent)}`}
                />
                <span className="text-xs font-medium w-8 text-right">
                  {sector.occupancyPercent}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
