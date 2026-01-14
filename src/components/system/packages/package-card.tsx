// src/components/system/packages/package-card.tsx

"use client";

import {
  DollarSign,
  MoreVertical,
  Package as PackageIcon,
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
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  package: PackageWithRelations;
  onEdit: (pkg: PackageWithRelations) => void;
  onDelete: (pkg: PackageWithRelations) => void;
  onToggleStatus: (pkg: PackageWithRelations) => void;
}

export function PackageCard({
  package: pkg,
  onEdit,
  onDelete,
  onToggleStatus,
}: PackageCardProps) {
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        !pkg.isActive && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PackageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none">{pkg.name}</h3>
            <Badge
              variant={pkg.isActive ? "default" : "secondary"}
              className="mt-1"
            >
              {pkg.isActive ? "Activo" : "Inactivo"}
            </Badge>
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
            <DropdownMenuItem onClick={() => onEdit(pkg)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(pkg)}>
              {pkg.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(pkg)}
              className="text-destructive focus:text-destructive"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {pkg.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {pkg.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Personas incluidas</span>
            </div>
            <p className="text-xl font-bold">{pkg.includedPeople}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Precio base</span>
            </div>
            <p className="text-xl font-bold">{formatPrice(pkg.basePrice)}</p>
          </div>
        </div>

        {pkg.extraPersonPrice && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Persona extra</span>
              <span className="font-medium">
                {formatPrice(pkg.extraPersonPrice)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
