// src/components/system/events/event-card.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Image as ImageIcon,
  LayoutGrid,
  MoreVertical,
  QrCode,
  Table,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EventWithRelationsDTO } from "@/lib/actions/types/event-types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: EventWithRelationsDTO;
  onEdit: (event: EventWithRelationsDTO) => void;
  onDelete: (event: EventWithRelationsDTO) => void;
  onToggleStatus: (event: EventWithRelationsDTO) => void;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
}: EventCardProps) {
  const isUpcoming = new Date(event.eventDate) > new Date();
  const isPast = new Date(event.eventDate) < new Date();
  const imageUrl = event.image ? `/uploads/${event.image}` : null;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200 overflow-hidden",
        !event.isActive && "opacity-60",
      )}
    >
      {imageUrl ? (
        <div className="relative w-full aspect-[9/16] bg-muted">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[9/16] bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
        </div>
      )}

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg leading-none line-clamp-1">
              {event.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={event.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {event.isActive ? "Activo" : "Inactivo"}
            </Badge>
            {isUpcoming && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Próximo
              </Badge>
            )}
            {isPast && (
              <Badge
                variant="outline"
                className="text-xs bg-gray-50 text-gray-700 border-gray-200"
              >
                Finalizado
              </Badge>
            )}
            {event.paymentQR && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                <QrCode className="h-3 w-3 mr-1" />
                QR Pago
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(event)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(event)}>
              {event.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(event)}
              className="text-destructive focus:text-destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {format(new Date(event.eventDate), "dd 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.eventDate), "HH:mm")} hrs
            </p>
          </div>
        </div>

        {(event.commissionAmount !== null ||
          event.freeInvitationQRCount > 0) && (
          <div className="pt-2 border-t space-y-1 text-sm">
            {event.commissionAmount !== null && (
              <p className="text-muted-foreground">
                <span className="font-medium">Comisión:</span> Bs.{" "}
                {event.commissionAmount.toFixed(2)}
              </p>
            )}
            {event.freeInvitationQRCount > 0 && (
              <p className="text-muted-foreground">
                <span className="font-medium">QR gratis:</span>{" "}
                {event.freeInvitationQRCount} por reserva
              </p>
            )}
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{event._count.eventSectors}</p>
                <p className="text-xs text-muted-foreground">Sectores</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{event._count.eventTables}</p>
                <p className="text-xs text-muted-foreground">Mesas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>
            Visible: {format(new Date(event.visibilityStart), "dd/MM/yyyy")} -{" "}
            {format(new Date(event.visibilityEnd), "dd/MM/yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
