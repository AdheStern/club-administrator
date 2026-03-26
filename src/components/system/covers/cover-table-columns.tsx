// src/components/system/covers/cover-table-columns.tsx

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, MoreHorizontal, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CoverDTO } from "@/lib/actions/types/cover-types";

export const createCoverColumns = (
  onDelete: (cover: CoverDTO) => void,
  userRole: string,
): ColumnDef<CoverDTO>[] => {
  const canDelete = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole);

  const columns: ColumnDef<CoverDTO>[] = [
    {
      accessorKey: "createdAt",
      header: "Hora",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {format(new Date(row.original.createdAt), "HH:mm", { locale: es })}
        </span>
      ),
    },
    {
      accessorKey: "cashAmount",
      header: "Efectivo",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5 text-green-500" />
          <span className="font-mono text-sm">
            Bs. {row.original.cashAmount.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "qrAmount",
      header: "QR",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <QrCode className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-mono text-sm">
            Bs. {row.original.qrAmount.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-semibold font-mono">
          Bs. {row.original.total.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "createdByName",
      header: "Registrado por",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.createdByName}
        </span>
      ),
    },
  ];

  if (canDelete) {
    columns.push({
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return columns;
};
