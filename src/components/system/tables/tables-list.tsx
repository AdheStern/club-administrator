"use client";

import type { ClubTable } from "@prisma/client";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTable, getTables } from "@/lib/actions/tables.actions";
import { TableForm } from "./table-form";

export function TablesList() {
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<ClubTable | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Solución Biome: useCallback para memorizar la función
  const loadTables = useCallback(async () => {
    setIsLoading(true);
    const result = await getTables();
    if (result.success && result.data) {
      setTables(result.data);
    } else {
      toast.error("Error al cargar las mesas");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]); // Ahora loadTables es una dependencia segura

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la mesa "${name}"?`)) {
      const result = await deleteTable(id);
      if (result.success) {
        toast.success("Mesa eliminada");
        loadTables();
      } else {
        toast.error("Error al eliminar");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Gestión de Mesas
          </h2>
          <p className="text-muted-foreground text-sm">
            Configura el inventario base de tu club
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTable(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Mesa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
          Cargando inventario...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.length === 0 && (
            <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">No hay mesas creadas aún.</p>
            </div>
          )}

          {tables.map((table) => (
            <Card
              key={table.id}
              className={`transition-all hover:shadow-md ${
                !table.isActive ? "opacity-60 bg-muted/30" : ""
              }`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold truncate">
                  {table.name}
                </CardTitle>
                <div
                  className={`w-3 h-3 rounded-full ${
                    table.isActive
                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : "bg-gray-400"
                  }`}
                  title={table.isActive ? "Activa" : "Inactiva"}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-foreground">
                    {table.capacity}
                  </span>
                  <span>personas máx.</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setEditingTable(table);
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
                    onClick={() => handleDelete(table.id, table.name)}
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
        <TableForm
          table={editingTable}
          // organizationId eliminado
          onClose={() => {
            setShowForm(false);
            setEditingTable(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingTable(null);
            loadTables();
          }}
        />
      )}
    </div>
  );
}
