// src/lib/actions/types/package-types.ts

import type { Package } from "@prisma/client";

export interface CreatePackageDTO {
  name: string;
  description?: string;
  includedPeople: number;
  basePrice: number;
  extraPersonPrice?: number;
  color?: string;
  sectorIds?: string[];
}

export interface UpdatePackageDTO {
  id: string;
  name?: string;
  description?: string;
  includedPeople?: number;
  basePrice?: number;
  extraPersonPrice?: number;
  isActive?: boolean;
  color?: string;
  sectorIds?: string[];
}

export interface PackageFilters {
  search?: string;
  isActive?: boolean;
  sectorId?: string;
}

export interface PackageSectorItem {
  id: string;
  packageId: string;
  sectorId: string;
  createdAt: Date;
  sector: {
    id: string;
    name: string;
  };
}

export type PackageWithRelations = Package & {
  _count: {
    requests: number;
  };
  packageSectors: PackageSectorItem[];
};
