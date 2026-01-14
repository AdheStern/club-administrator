// src/lib/actions/types/sector-types.ts

import type { Sector } from "@prisma/client";

export interface CreateSectorDTO {
  name: string;
  description?: string;
  capacity: number;
}

export interface UpdateSectorDTO {
  id: string;
  name?: string;
  description?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface SectorFilters {
  search?: string;
  isActive?: boolean;
}

export type SectorWithRelations = Sector & {
  _count: {
    tables: number;
    eventSectors: number;
  };
};
