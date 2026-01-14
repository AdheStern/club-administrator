// src/components/system/dashboard/upcoming-events.tsx

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UpcomingEvent } from "@/lib/actions/dashboard-actions";

interface UpcomingEventsProps {
  data: UpcomingEvent[];
}

export function UpcomingEvents({ data }: UpcomingEventsProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((event) => {
            const approvalRate =
              event.requestCount > 0
                ? (event.approvedCount / event.requestCount) * 100
                : 0;

            return (
              <div
                key={event.id}
                className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{event.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.eventDate), "dd MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {event.requestCount} solicitudes
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tasa de aprobación
                      </span>
                      <span className="font-medium">
                        {approvalRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={approvalRate} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{event.approvedCount} aprobadas</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span>{event.pendingCount} pendientes</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay eventos próximos</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
