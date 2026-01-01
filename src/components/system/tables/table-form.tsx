"use client";

import type { ClubTable } from "@prisma/client";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTable, updateTable } from "@/lib/actions/tables.actions";

interface TableFormProps {
  table?: ClubTable | null;
  // organizationId eliminado ya que no lo usaremos en el prototipo
  onClose: () => void;
  onSuccess: () => void;
}

export function TableForm({ table, onClose, onSuccess }: TableFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: table?.name || "",
    capacity: table?.capacity || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error("El nombre de la mesa es requerido");
        return;
      }

      if (formData.capacity < 1) {
        toast.error("La capacidad debe ser mayor a 0");
        return;
      }

      let result;

      if (table) {
        result = await updateTable(table.id, formData);
      } else {
        // Corregido: Ya no pasamos organizationId, solo formData
        result = await createTable(formData);
      }

      if (result.success) {
        toast.success(
          table ? "Mesa actualizada correctamente" : "Mesa creada correctamente"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>{table ? "Editar Mesa" : "Nueva Mesa"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Mesa</Label>
              <Input
                id="name"
                placeholder="ej: Mesa Premium 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad (Personas)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="ej: 10"
                value={formData.capacity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
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
