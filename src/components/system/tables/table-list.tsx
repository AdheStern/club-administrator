// src/components/system/tables/table-list.tsx

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
import { deleteTable, toggleTableStatus } from "@/lib/actions/table-actions";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { TableCard } from "./table-card";
import { TableFormDrawer } from "./table-form-drawer";

interface TableListProps {
  initialTables: TableWithRelations[];
  sectors: SectorWithRelations[];
  onRefresh: () => void;
}

export function TableList({
  initialTables,
  sectors,
  onRefresh,
}: TableListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<TableWithRelations | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableWithRelations | null>(
    null
  );

  const filteredTables = initialTables.filter((table) => {
    const matchesSearch =
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.sector.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector =
      selectedSector === "all" || table.sectorId === selectedSector;

    const matchesType =
      selectedType === "all" || table.tableType === selectedType;

    return matchesSearch && matchesSector && matchesType;
  });

  const handleEdit = (table: TableWithRelations) => {
    setSelectedTable(table);
    setIsFormOpen(true);
  };

  const handleDelete = (table: TableWithRelations) => {
    setTableToDelete(table);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (table: TableWithRelations) => {
    const result = await toggleTableStatus(table.id);

    if (result.success) {
      toast.success(
        table.isActive
          ? "Mesa desactivada correctamente"
          : "Mesa activada correctamente"
      );
      onRefresh();
    } else {
      toast.error(result.error || "Error al cambiar estado de la mesa");
    }
  };

  const confirmDelete = async () => {
    if (!tableToDelete) return;

    const result = await deleteTable(tableToDelete.id);

    if (result.success) {
      toast.success("Mesa eliminada correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar mesa");
    }

    setIsDeleteDialogOpen(false);
    setTableToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTable(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Mesas</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva mesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar mesas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los sectores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los sectores</SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="COMMON">Común</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="LOUNGE">Lounge</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ||
                selectedSector !== "all" ||
                selectedType !== "all"
                  ? "No se encontraron mesas con los filtros aplicados"
                  : "No hay mesas creadas"}
              </p>
              {!searchQuery &&
                selectedSector === "all" &&
                selectedType === "all" && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera mesa
                  </Button>
                )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TableFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        table={selectedTable}
        sectors={sectors}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar mesa?"
        description={`¿Estás seguro de que deseas eliminar la mesa "${tableToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
