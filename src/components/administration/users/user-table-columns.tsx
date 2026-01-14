// src/components/administration/users/user-table-columns.tsx

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, UserCog } from "lucide-react";
import { RoleBadge } from "@/components/administration/shared/role-badge";
import { StatusBadge } from "@/components/administration/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserWithRelations } from "@/lib/actions/types/action-types";

interface UserActionsProps {
  user: UserWithRelations;
  onEdit: (user: UserWithRelations) => void;
  onDelete: (user: UserWithRelations) => void;
  onManageRole: (user: UserWithRelations) => void;
}

function UserActions({
  user,
  onEdit,
  onDelete,
  onManageRole,
}: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onManageRole(user)}>
          <UserCog className="mr-2 h-4 w-4" />
          Gestionar rol
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createUserColumns = (
  onEdit: (user: UserWithRelations) => void,
  onDelete: (user: UserWithRelations) => void,
  onManageRole: (user: UserWithRelations) => void
): ColumnDef<UserWithRelations>[] => [
  {
    accessorKey: "name",
    header: "Usuario",
    cell: ({ row }) => {
      const user = row.original;
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => <RoleBadge role={row.original.role as any} />,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
  },
  {
    accessorKey: "department",
    header: "Departamento",
    cell: ({ row }) => {
      const dept = row.original.department;
      return dept ? (
        <span className="text-sm">{dept.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Sin departamento</span>
      );
    },
  },
  {
    accessorKey: "manager",
    header: "Manager",
    cell: ({ row }) => {
      const manager = row.original.manager;
      return manager ? (
        <span className="text-sm">{manager.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Sin manager</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de registro",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd MMM yyyy", {
            locale: es,
          })}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <UserActions
        user={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageRole={onManageRole}
      />
    ),
  },
];
