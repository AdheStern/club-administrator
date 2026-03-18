// src/components/system/event-panel/recent-requests-list.tsx

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentRequestDTO } from "@/lib/actions/types/event-panel-types";

interface RecentRequestsListProps {
  requests: RecentRequestDTO[];
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  PRE_APPROVED: { label: "Pre-aprob.", variant: "secondary" },
  APPROVED: { label: "Aprobada", variant: "default" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  OBSERVED: { label: "Observada", variant: "outline" },
};

export function RecentRequestsList({ requests }: RecentRequestsListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold">
          Últimas Solicitudes
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Las 8 más recientes del evento
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-1">
        {requests.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin solicitudes
          </p>
        )}
        {requests.map((req) => {
          const statusCfg = STATUS_CONFIG[req.status] ?? {
            label: req.status,
            variant: "outline" as const,
          };
          return (
            <div
              key={req.id}
              className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{req.clientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {req.sectorName} · {req.tableName} · {req.packageName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <Badge
                  variant={statusCfg.variant}
                  className="text-xs px-1.5 py-0"
                >
                  {statusCfg.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(req.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
