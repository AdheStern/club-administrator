// src/components/system/sectors/sector-list.tsx

"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteSector, toggleSectorStatus } from "@/lib/actions/sector-actions";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import { SectorCard } from "./sector-card";
import { SectorFormDrawer } from "./sector-form-drawer";

interface SectorListProps {
  initialSectors: SectorWithRelations[];
  onRefresh: () => void;
}

export function SectorList({ initialSectors, onRefresh }: SectorListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] =
    useState<SectorWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] =
    useState<SectorWithRelations | null>(null);

  const filteredSectors = initialSectors.filter(
    (sector) =>
      sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sector.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (sector: SectorWithRelations) => {
    setSelectedSector(sector);
    setIsFormOpen(true);
  };

  const handleDelete = (sector: SectorWithRelations) => {
    setSectorToDelete(sector);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (sector: SectorWithRelations) => {
    const result = await toggleSectorStatus(sector.id);

    if (result.success) {
      toast.success(
        sector.isActive
          ? "Sector desactivado correctamente"
          : "Sector activado correctamente"
      );
      onRefresh();
    } else {
      toast.error(result.error || "Error al cambiar estado del sector");
    }
  };

  const confirmDelete = async () => {
    if (!sectorToDelete) return;

    const result = await deleteSector(sectorToDelete.id);

    if (result.success) {
      toast.success("Sector eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar sector");
    }

    setIsDeleteDialogOpen(false);
    setSectorToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedSector(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Sectores</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo sector
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sectores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredSectors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No se encontraron sectores"
                  : "No hay sectores creados"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer sector
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSectors.map((sector) => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SectorFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        sector={selectedSector}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar sector?"
        description={`¿Estás seguro de que deseas eliminar el sector "${sectorToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
