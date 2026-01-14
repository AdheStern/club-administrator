// src/components/system/packages/package-list.tsx

"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deletePackage,
  togglePackageStatus,
} from "@/lib/actions/package-actions";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import { PackageCard } from "./package-card";
import { PackageFormDrawer } from "./package-form-drawer";

interface PackageListProps {
  initialPackages: PackageWithRelations[];
  onRefresh: () => void;
}

export function PackageList({ initialPackages, onRefresh }: PackageListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] =
    useState<PackageWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] =
    useState<PackageWithRelations | null>(null);

  const filteredPackages = initialPackages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (pkg: PackageWithRelations) => {
    setSelectedPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDelete = (pkg: PackageWithRelations) => {
    setPackageToDelete(pkg);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (pkg: PackageWithRelations) => {
    const result = await togglePackageStatus(pkg.id);

    if (result.success) {
      toast.success(
        pkg.isActive
          ? "Paquete desactivado correctamente"
          : "Paquete activado correctamente"
      );
      onRefresh();
    } else {
      toast.error(result.error || "Error al cambiar estado del paquete");
    }
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;

    const result = await deletePackage(packageToDelete.id);

    if (result.success) {
      toast.success("Paquete eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar paquete");
    }

    setIsDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPackage(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Paquetes</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo paquete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paquetes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No se encontraron paquetes"
                  : "No hay paquetes creados"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer paquete
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PackageFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        package={selectedPackage}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar paquete?"
        description={`¿Estás seguro de que deseas eliminar el paquete "${packageToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
