// src/components/system/dashboard/dashboard-filters.tsx
"use client";

import { Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DashboardFilters,
  FilterOptions,
} from "@/lib/actions/dashboard-actions";

interface DashboardFiltersComponentProps {
  filters: DashboardFilters;
  options: FilterOptions;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersComponent({
  filters,
  options,
  onFiltersChange,
}: DashboardFiltersComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === "all" ? undefined : value,
    };

    if (key === "sectorId" && value === "all") {
      newFilters.tableId = undefined;
    }

    onFiltersChange(newFilters);
  };

  const hasActiveFilters =
    filters.eventId || filters.sectorId || filters.tableId || filters.userId;

  const clearFilters = () => {
    onFiltersChange({});
    setIsOpen(false);
  };

  const filteredTables = useMemo(() => {
    if (!filters.sectorId) return [];
    return options.tables.filter(
      (table) => table.sectorId === filters.sectorId,
    );
  }, [filters.sectorId, options.tables]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full text-xs text-primary-foreground flex items-center justify-center font-medium">
              {
                [
                  filters.eventId,
                  filters.sectorId,
                  filters.tableId,
                  filters.userId,
                ].filter(Boolean).length
              }
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filtros del Dashboard</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs gap-1"
              >
                <X className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Evento</Label>
              <Select
                value={filters.eventId || "all"}
                onValueChange={(value) => handleFilterChange("eventId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {options.events.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sector</Label>
              <Select
                value={filters.sectorId || "all"}
                onValueChange={(value) => handleFilterChange("sectorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los sectores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sectores</SelectItem>
                  {options.sectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mesa</Label>
              <Select
                value={filters.tableId || "all"}
                onValueChange={(value) => handleFilterChange("tableId", value)}
                disabled={!filters.sectorId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !filters.sectorId
                        ? "Selecciona un sector primero"
                        : "Todas las mesas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las mesas</SelectItem>
                  {filteredTables.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Usuario</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) => handleFilterChange("userId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {options.users.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {
                  [
                    filters.eventId,
                    filters.sectorId,
                    filters.tableId,
                    filters.userId,
                  ].filter(Boolean).length
                }{" "}
                filtro(s) activo(s)
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
