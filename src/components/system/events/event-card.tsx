// src/components/system/events/event-card.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, LayoutGrid, MoreVertical, Table } from "lucide-react";
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
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: EventWithRelations;
  onEdit: (event: EventWithRelations) => void;
  onDelete: (event: EventWithRelations) => void;
  onToggleStatus: (event: EventWithRelations) => void;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
}: EventCardProps) {
  const isUpcoming = new Date(event.eventDate) > new Date();
  const isPast = new Date(event.eventDate) < new Date();

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        !event.isActive && "opacity-60"
      )}
    >
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
