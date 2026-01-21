// src/components/system/sectors/sector-card.tsx

"use client";

import {
  Building2,
  ClipboardList,
  MoreVertical,
  Table,
  Users,
} from "lucide-react";
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
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import { cn } from "@/lib/utils";

interface SectorCardProps {
  sector: SectorWithRelations;
  onEdit: (sector: SectorWithRelations) => void;
  onDelete: (sector: SectorWithRelations) => void;
  onToggleStatus: (sector: SectorWithRelations) => void;
}

export function SectorCard({
  sector,
  onEdit,
  onDelete,
  onToggleStatus,
}: SectorCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        !sector.isActive && "opacity-60",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none">
              {sector.name}
            </h3>
            <div className="flex gap-2">
              <Badge
                variant={sector.isActive ? "default" : "secondary"}
                className="mt-1"
              >
                {sector.isActive ? "Activo" : "Inactivo"}
              </Badge>
              {sector.requiresGuestList && (
                <Badge variant="outline" className="mt-1">
                  <ClipboardList className="h-3 w-3 mr-1" />
                  Lista requerida
                </Badge>
              )}
            </div>
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
            <DropdownMenuItem onClick={() => onEdit(sector)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(sector)}>
              {sector.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(sector)}
              className="text-destructive focus:text-destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        {sector.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {sector.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{sector.capacity}</p>
              <p className="text-xs text-muted-foreground">Capacidad</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Table className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{sector._count.tables}</p>
              <p className="text-xs text-muted-foreground">Mesas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
