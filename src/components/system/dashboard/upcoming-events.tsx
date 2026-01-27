// src/components/system/dashboard/upcoming-events.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UpcomingEvent } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface UpcomingEventsCarouselProps {
  data: UpcomingEvent[];
}

export function UpcomingEventsCarousel({ data }: UpcomingEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (data.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No hay eventos próximos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const event = data[currentIndex];
  const approvalRate =
    event.requestCount > 0
      ? (event.approvedCount / event.requestCount) * 100
      : 0;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Eventos
          </div>
          {data.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === 0 ? data.length - 1 : prev - 1,
                  )
                }
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {data.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === data.length - 1 ? 0 : prev + 1,
                  )
                }
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            {event.image ? (
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <Calendar className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-semibold text-white">{event.name}</h3>
              <p className="text-sm text-white/90">
                {format(
                  new Date(event.eventDate),
                  "EEEE, dd 'de' MMMM 'del' yyyy",
                  { locale: es },
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">
                {event.requestCount} solicitudes
              </Badge>
              <span className="text-2xl font-bold">
                {approvalRate.toFixed(0)}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tasa de aprobación
                </span>
              </div>
              <Progress value={approvalRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Aprobadas</p>
                  <p className="text-lg font-semibold">{event.approvedCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-lg font-semibold">{event.pendingCount}</p>
                </div>
              </div>
            </div>
          </div>

          {data.length > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              {data.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                  aria-label={`Ir al evento ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
