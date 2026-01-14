// src/lib/actions/types/package-types.ts

import type { Package } from "@prisma/client";

export interface CreatePackageDTO {
  name: string;
  description?: string;
  includedPeople: number;
  basePrice: number;
  extraPersonPrice?: number;
}

export interface UpdatePackageDTO {
  id: string;
  name?: string;
  description?: string;
  includedPeople?: number;
  basePrice?: number;
  extraPersonPrice?: number;
  isActive?: boolean;
}

export interface PackageFilters {
  search?: string;
  isActive?: boolean;
}

export type PackageWithRelations = Package & {
  _count: {
    requests: number;
  };
};
