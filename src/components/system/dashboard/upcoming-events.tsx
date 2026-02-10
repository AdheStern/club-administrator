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
  DollarSign,
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

function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || "/uploads";
  return `${uploadUrl}/${imagePath}`;
}

export function UpcomingEventsCarousel({ data }: UpcomingEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay eventos próximos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const event = data[currentIndex];
  const imageUrl = getImageUrl(event.image);
  const approvalRate =
    event.requestCount > 0
      ? (event.approvedCount / event.requestCount) * 100
      : 0;

  return (
    <Card className="h-full hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm">Próximos Eventos</span>
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
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground font-mono">
                {currentIndex + 1}/{data.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === data.length - 1 ? 0 : prev + 1,
                  )
                }
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-[9/16] overflow-hidden rounded-lg border shadow-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="h-24 w-24 text-muted-foreground/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            <div>
              <h3 className="text-xl font-bold text-white leading-tight mb-1">
                {event.name}
              </h3>
              <p className="text-sm text-white/90">
                {format(new Date(event.eventDate), "EEEE, dd 'de' MMMM", {
                  locale: es,
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {event.requestCount} solicitudes
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-white border-green-500/30"
              >
                {approvalRate.toFixed(0)}% aprobación
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Aprobadas</p>
                <p className="text-lg font-bold">{event.approvedCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
              <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-lg font-bold">{event.pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">
                  Ingresos Potenciales
                </p>
              </div>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(event.potentialRevenue)}
              </p>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>
        </div>

        {data.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {data.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                aria-label={`Ir al evento ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
