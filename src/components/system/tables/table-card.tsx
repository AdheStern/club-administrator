// src/components/system/tables/table-card.tsx

"use client";

import { MoreVertical, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { cn } from "@/lib/utils";

interface TableCardProps {
  table: TableWithRelations;
  onEdit: (table: TableWithRelations) => void;
  onDelete: (table: TableWithRelations) => void;
  onToggleStatus: (table: TableWithRelations) => void;
}

const tableTypeLabels: Record<string, string> = {
  VIP: "VIP",
  COMMON: "Común",
  LOUNGE: "Lounge",
  PREMIUM: "Premium",
};

const tableTypeColors: Record<string, string> = {
  VIP: "bg-amber-500/10 text-amber-700 border-amber-200",
  COMMON: "bg-blue-500/10 text-blue-700 border-blue-200",
  LOUNGE: "bg-purple-500/10 text-purple-700 border-purple-200",
  PREMIUM: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};

export function TableCard({
  table,
  onEdit,
  onDelete,
  onToggleStatus,
}: TableCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        !table.isActive && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg leading-none">{table.name}</h3>
            <Badge
              variant={table.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {table.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", tableTypeColors[table.tableType])}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tableTypeLabels[table.tableType] || table.tableType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {table.sector.name}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(table)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(table)}>
              {table.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(table)}
              className="text-destructive focus:text-destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{table.capacity}</p>
              <p className="text-xs text-muted-foreground">Capacidad</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
