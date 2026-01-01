"use client";

import type { ClubTable, Event, EventTableInstance } from "@prisma/client";
import { Calendar, Edit2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteEvent, getEvents } from "@/lib/actions/events.actions";
import { getTables } from "@/lib/actions/tables.actions";
import { EventForm } from "./event-form";

// Definimos el tipo compuesto
type EventWithTables = Event & {
  tables: (EventTableInstance & { table: ClubTable })[];
};

export function EventsList() {
  const [events, setEvents] = useState<EventWithTables[]>([]);
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithTables | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fix Biome: useCallback para memorizar la función
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsResult, tablesResult] = await Promise.all([
        getEvents(),
        getTables(),
      ]);

      if (eventsResult.success && eventsResult.data) {
        setEvents(eventsResult.data as EventWithTables[]);
      }
      if (tablesResult.success && tablesResult.data) {
        setTables(tablesResult.data);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el evento "${name}"?`)) {
      const result = await deleteEvent(id);
      if (result.success) {
        toast.success("Evento eliminado");
        loadData();
      } else {
        toast.error("Error al eliminar");
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Gestión de Eventos
          </h2>
          <p className="text-muted-foreground text-sm">
            Crea noches y asigna disponibilidad de mesas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
          Cargando calendario...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 && (
            <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                No hay eventos programados.
              </p>
            </div>
          )}

          {events.map((event) => (
            <Card key={event.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{event.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                  <Calendar className="h-4 w-4" />
                  <span className="capitalize">{formatDate(event.date)}</span>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                    Disponibilidad ({event.tables.length} mesas)
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                    {event.tables.slice(0, 8).map((instance) => (
                      <span
                        key={instance.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          instance.status === "AVAILABLE"
                            ? "bg-blue-50/50 text-blue-700 border-blue-200"
                            : "bg-amber-50/50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {instance.table.name}
                      </span>
                    ))}
                    {event.tables.length > 8 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        +{event.tables.length - 8} más...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setEditingEvent(event);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="px-3"
                    onClick={() => handleDelete(event.id, event.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editingEvent}
          tables={tables}
          // organizationId eliminado
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingEvent(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
