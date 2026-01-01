"use client";

import type { ClubTable, Event, EventTableInstance } from "@prisma/client";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent, updateEvent } from "@/lib/actions/events.actions";

// Tipo auxiliar para manejar el evento con sus relaciones
type EventWithTables = Event & { tables: EventTableInstance[] };

interface EventFormProps {
  event?: EventWithTables | null;
  tables: ClubTable[];
  // organizationId eliminado
  onClose: () => void;
  onSuccess: () => void;
}

export function EventForm({
  event,
  tables,
  onClose,
  onSuccess,
}: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: event?.name || "",
    date: event?.date ? new Date(event.date).toISOString().split("T")[0] : "",
    tableIds: event?.tables.map((t) => t.tableId) || [],
  });

  const handleTableToggle = (tableId: string) => {
    setFormData((prev) => ({
      ...prev,
      tableIds: prev.tableIds.includes(tableId)
        ? prev.tableIds.filter((id) => id !== tableId)
        : [...prev.tableIds, tableId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error("El nombre del evento es requerido");
        return;
      }

      if (!formData.date) {
        toast.error("La fecha es requerida");
        return;
      }

      if (formData.tableIds.length === 0) {
        toast.error("Debes seleccionar al menos una mesa");
        return;
      }

      let result;

      if (event) {
        result = await updateEvent(event.id, {
          name: formData.name,
          date: formData.date,
          tableIds: formData.tableIds, // Ahora sí enviamos las mesas
        });
      } else {
        result = await createEvent(formData);
      }

      if (result.success) {
        toast.success(
          event
            ? "Evento actualizado correctamente"
            : "Evento creado correctamente"
        );
        onSuccess();
      } else {
        toast.error(result.error || "Ocurrió un error");
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>{event ? "Editar Evento" : "Nuevo Evento"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Evento</Label>
              <Input
                id="name"
                placeholder="ej: Noche de Viernes"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Mesas Disponibles para este evento</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-secondary/20">
                {tables.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay mesas creadas en el sistema
                  </p>
                ) : (
                  tables.map((table) => (
                    <div
                      key={table.id}
                      className="flex items-center gap-2 p-1 hover:bg-secondary/50 rounded"
                    >
                      <Checkbox
                        id={table.id}
                        checked={formData.tableIds.includes(table.id)}
                        onCheckedChange={() => handleTableToggle(table.id)}
                      />
                      <Label
                        htmlFor={table.id}
                        className="font-normal cursor-pointer flex-1 text-sm"
                      >
                        {table.name}{" "}
                        <span className="text-muted-foreground">
                          ({table.capacity} pax)
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
