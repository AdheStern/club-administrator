// src/components/system/dashboard/pending-requests-list.tsx

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, User } from "lucide-react"; // ✅ Agregar CheckCircle aquí
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { PendingRequest } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface PendingRequestsListProps {
  data: PendingRequest[];
}

export function PendingRequestsList({ data }: PendingRequestsListProps) {
  const getWaitingTimeColor = (hours: number) => {
    if (hours < 24) return "text-green-600";
    if (hours < 48) return "text-yellow-600";
    return "text-red-600";
  };

  const getWaitingTimeText = (hours: number) => {
    if (hours < 1) return "Hace menos de 1 hora";
    if (hours < 24)
      return `Hace ${Math.floor(hours)} hora${
        Math.floor(hours) !== 1 ? "s" : ""
      }`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? "s" : ""}`;
  };

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Solicitudes Pendientes de Revisión
        </CardTitle>
        <Link href="/requests?status=PENDING">
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {data.map((request, index) => (
              <div key={request.id}>
                <Link href={`/requests?id=${request.id}`}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">
                              {request.event.name}
                            </h4>
                            <Badge
                              variant={
                                request.status === "OBSERVED"
                                  ? "secondary"
                                  : "default"
                              }
                              className="text-xs"
                            >
                              {request.status === "PENDING"
                                ? "Pendiente"
                                : "Observada"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{request.client.name}</span>
                            <span>•</span>
                            <span>CI: {request.client.identityCard}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(
                              new Date(request.createdAt),
                              "dd MMM yyyy, HH:mm",
                              { locale: es }
                            )}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "font-medium",
                            getWaitingTimeColor(request.waitingTime)
                          )}
                        >
                          {getWaitingTimeText(request.waitingTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {index < data.length - 1 && <Separator className="my-2" />}
              </div>
            ))}

            {data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No hay solicitudes pendientes</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
