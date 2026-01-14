// src/components/administration/users/user-list.tsx

"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { DataTable } from "@/components/administration/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  DepartmentWithRelations,
  UserWithRelations,
} from "@/lib/actions/types/action-types";
import { deleteUser } from "@/lib/actions/user-actions";
import { UserFormDrawer } from "./user-form-drawer";
import { createUserColumns } from "./user-table-columns";

interface UserListProps {
  initialUsers: UserWithRelations[];
  departments: DepartmentWithRelations[];
  onRefresh: () => void;
}

export function UserList({
  initialUsers,
  departments,
  onRefresh,
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRelations | null>(
    null
  );

  const filteredUsers = initialUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: UserWithRelations) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: UserWithRelations) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleManageRole = (user: UserWithRelations) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast.success("Usuario eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar usuario");
    }

    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const columns = createUserColumns(handleEdit, handleDelete, handleManageRole);

  const managers = initialUsers.filter(
    (u) =>
      u.role === "MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable columns={columns} data={filteredUsers} />
        </CardContent>
      </Card>

      <UserFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        user={selectedUser}
        departments={departments}
        managers={managers}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar usuario?"
        description={`¿Estás seguro de que deseas eliminar a ${userToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
