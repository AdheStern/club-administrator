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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReservation } from "@/lib/actions/reservations.actions";

interface ReservationFormProps {
  eventId: string;
  event: Event & { tables: (EventTableInstance & { table: ClubTable })[] };
  onClose: () => void;
  onSuccess: () => void;
}

export function ReservationForm({
  eventId,
  event,
  onClose,
  onSuccess,
}: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerDoc: "",
    selectedTableId: "",
    extraGuests: 0,
    hasConsumption: false,
  });

  // Solo mostramos mesas DISPONIBLES
  const availableTables = event.tables.filter((t) => t.status === "AVAILABLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.customerName.trim()) {
        toast.error("El nombre es requerido");
        return;
      }

      if (!formData.selectedTableId) {
        toast.error("Debes seleccionar una mesa");
        return;
      }

      // Encontrar la instancia de mesa correcta
      const tableInstance = event.tables.find(
        (t) => t.tableId === formData.selectedTableId
      );

      if (!tableInstance) {
        toast.error("Mesa no válida");
        return;
      }

      // TODO: Aquí deberías obtener el ID del usuario actual desde tu hook de auth
      const currentUserId = "user-demo-id";

      const result = await createReservation(
        eventId,
        tableInstance.id,
        currentUserId,
        {
          customerName: formData.customerName,
          customerDoc: formData.customerDoc,
          extraGuests: formData.extraGuests,
          hasConsumption: formData.hasConsumption,
        }
      );

      if (result.success) {
        toast.success("Reserva creada exitosamente");
        onSuccess();
      } else {
        toast.error(result.error || "Error al crear reserva");
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
          <CardTitle>Nueva Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Cliente</Label>
              <Input
                id="name"
                placeholder="Ej: Juan Pérez"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc">Documento (DNI/CI)</Label>
              <Input
                id="doc"
                placeholder="Ej: 12345678"
                value={formData.customerDoc}
                onChange={(e) =>
                  setFormData({ ...formData, customerDoc: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table">Seleccionar Mesa</Label>
              <Select
                value={formData.selectedTableId}
                onValueChange={(val) =>
                  setFormData({ ...formData, selectedTableId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ver mesas disponibles..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No hay mesas disponibles
                    </div>
                  ) : (
                    availableTables.map((instance) => (
                      <SelectItem key={instance.id} value={instance.tableId}>
                        {instance.table.name} - Capacidad:{" "}
                        {instance.table.capacity}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">Extras</Label>
                <Input
                  id="guests"
                  type="number"
                  min="0"
                  value={formData.extraGuests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extraGuests: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2 border p-2 rounded-md w-full bg-secondary/20">
                  <Checkbox
                    id="consumption"
                    checked={formData.hasConsumption}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, hasConsumption: !!c })
                    }
                  />
                  <Label
                    htmlFor="consumption"
                    className="cursor-pointer text-sm"
                  >
                    Con Consumo
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
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
                {isLoading ? "Crear Reserva" : "Crear Reserva"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
