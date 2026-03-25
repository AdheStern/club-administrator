// src/components/system/guests/guest-table-columns.tsx

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GuestWithStats } from "@/lib/actions/types/guest-types";

interface GuestActionsProps {
  guest: GuestWithStats;
  onView: (guest: GuestWithStats) => void;
  onEdit: (guest: GuestWithStats) => void;
  onDelete: (guest: GuestWithStats) => void;
}

function GuestActions({ guest, onView, onEdit, onDelete }: GuestActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(guest)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(guest)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(guest)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createGuestColumns = (
  onView: (guest: GuestWithStats) => void,
  onEdit: (guest: GuestWithStats) => void,
  onDelete: (guest: GuestWithStats) => void,
): ColumnDef<GuestWithStats>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "identityCard",
    header: "CI",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.identityCard}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Contacto",
    cell: ({ row }) => {
      const { phone, instagramHandle } = row.original;
      return (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {phone && <span>{phone}</span>}
          {instagramHandle && (
            <span className="text-pink-400">@{instagramHandle}</span>
          )}
          {!phone && !instagramHandle && (
            <span className="italic">Sin contacto</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "loyaltyPoints",
    header: "Puntos",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-sm">{row.original.loyaltyPoints}</span>
      </div>
    ),
  },
  {
    accessorKey: "eventsAttended",
    header: "Eventos",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.eventsAttended}</Badge>
    ),
  },
  {
    accessorKey: "requestsAsClient",
    header: "Reservas",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original._count.requestsAsClient}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Registrado",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy", {
          locale: es,
        })}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <GuestActions
        guest={row.original}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
