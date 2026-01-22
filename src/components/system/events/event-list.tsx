// src/components/system/events/event-list.tsx
"use client";

import { Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteEvent, toggleEventStatus } from "@/lib/actions/event-actions";
import { convertDecimalsToNumbers } from "@/lib/actions/helpers/decimal-converter";
import type {
  EventWithRelations,
  EventWithRelationsDTO,
} from "@/lib/actions/types/event-types";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { EventCard } from "./event-card";
import { EventFormDrawer } from "./event-form-drawer";

interface EventListProps {
  initialEvents: EventWithRelations[];
  sectors: SectorWithRelations[];
  tables: TableWithRelations[];
  onRefresh: () => void;
}

function convertEventToDTO(event: EventWithRelations): EventWithRelationsDTO {
  return {
    ...event,
    commissionAmount: event.commissionAmount
      ? Number(event.commissionAmount)
      : null,
    eventSectors: event.eventSectors.map((es) => ({
      ...es,
      sector: es.sector,
    })),
    eventTables: event.eventTables.map((et) => ({
      ...et,
      table: et.table,
    })),
  };
}

export function EventList({
  initialEvents,
  sectors,
  tables,
  onRefresh,
}: EventListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] =
    useState<EventWithRelationsDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] =
    useState<EventWithRelationsDTO | null>(null);

  const eventsDTO = initialEvents.map(convertEventToDTO);

  const filteredEvents = eventsDTO.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && event.isActive) ||
      (statusFilter === "inactive" && !event.isActive);

    const now = new Date();
    const eventDate = new Date(event.eventDate);

    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "upcoming" && eventDate > now) ||
      (timeFilter === "past" && eventDate < now);

    return matchesSearch && matchesStatus && matchesTime;
  });

  const handleEdit = (event: EventWithRelationsDTO) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = (event: EventWithRelationsDTO) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (event: EventWithRelationsDTO) => {
    const result = await toggleEventStatus(event.id);

    if (result.success) {
      toast.success(
        event.isActive
          ? "Evento desactivado correctamente"
          : "Evento activado correctamente",
      );
      onRefresh();
    } else {
      toast.error(result.error || "Error al cambiar estado del evento");
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    const result = await deleteEvent(eventToDelete.id);

    if (result.success) {
      toast.success("Evento eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar evento");
    }

    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Eventos</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="past">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || timeFilter !== "all"
                  ? "No se encontraron eventos con los filtros aplicados"
                  : "No hay eventos creados"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                timeFilter === "all" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer evento
                  </Button>
                )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        event={selectedEvent}
        sectors={sectors}
        tables={tables}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar evento?"
        description={`¿Estás seguro de que deseas eliminar el evento "${eventToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
