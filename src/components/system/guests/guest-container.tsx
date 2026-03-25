// src/components/system/guests/guest-container.tsx

"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { DataTable } from "@/components/administration/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteGuest, getGuests } from "@/lib/actions/guest-actions";
import type { GuestWithStats } from "@/lib/actions/types/guest-types";
import { GuestDetailSheet } from "./guest-detail-sheet";
import { GuestFormDialog } from "./guest-form-dialog";
import { createGuestColumns } from "./guest-table-columns";

interface GuestContainerProps {
  initialGuests: GuestWithStats[];
}

export function GuestContainer({ initialGuests }: GuestContainerProps) {
  const [guests, setGuests] = useState<GuestWithStats[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GuestWithStats | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<GuestWithStats | null>(
    null,
  );

  const filteredGuests = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.identityCard.toLowerCase().includes(search.toLowerCase()) ||
      g.phone?.toLowerCase().includes(search.toLowerCase()) ||
      g.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.instagramHandle?.toLowerCase().includes(search.toLowerCase()),
  );

  const refresh = useCallback(async () => {
    const result = await getGuests({}, { page: 1, pageSize: 1000 });
    if (result.success && result.data) {
      setGuests(result.data.data);
    }
  }, []);

  const handleView = useCallback((guest: GuestWithStats) => {
    setSelected(guest);
    setIsDetailOpen(true);
  }, []);

  const handleEdit = useCallback((guest: GuestWithStats) => {
    setSelected(guest);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((guest: GuestWithStats) => {
    setGuestToDelete(guest);
    setIsDeleteOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelected(null);
    setIsFormOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!guestToDelete) return;

    const result = await deleteGuest(guestToDelete.id);
    if (result.success) {
      toast.success("Cliente eliminado");
      refresh();
    } else {
      toast.error(result.error ?? "Error al eliminar cliente");
    }

    setIsDeleteOpen(false);
    setGuestToDelete(null);
  };

  const columns = createGuestColumns(handleView, handleEdit, handleDelete);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clientes</CardTitle>
            <Button onClick={handleNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, CI, teléfono, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DataTable columns={columns} data={filteredGuests} />
        </CardContent>
      </Card>

      <GuestFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelected(null);
        }}
        guest={selected}
        onSuccess={() => {
          refresh();
          setIsFormOpen(false);
          setSelected(null);
        }}
      />

      <GuestDetailSheet
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelected(null);
        }}
        guest={selected}
      />

      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar cliente?"
        description={
          guestToDelete?._count.requestsAsClient
            ? `${guestToDelete.name} tiene ${guestToDelete._count.requestsAsClient} reserva(s) asociada(s) y no puede ser eliminado.`
            : `¿Estás seguro de que deseas eliminar a ${guestToDelete?.name}? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
