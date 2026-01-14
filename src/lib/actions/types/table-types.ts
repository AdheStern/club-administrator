// src/lib/actions/types/table-types.ts

import type { Table } from "@prisma/client";

export interface CreateTableDTO {
  name: string;
  sectorId: string;
  capacity: number;
  tableType?: string;
}

export interface UpdateTableDTO {
  id: string;
  name?: string;
  sectorId?: string;
  capacity?: number;
  tableType?: string;
  isActive?: boolean;
}

export interface TableFilters {
  search?: string;
  sectorId?: string;
  tableType?: string;
  isActive?: boolean;
}

export type TableWithRelations = Table & {
  sector: {
    id: string;
    name: string;
  };
  _count: {
    eventTables: number;
    requests: number;
  };
};

export enum TableType {
  VIP = "VIP",
  COMMON = "COMMON",
  LOUNGE = "LOUNGE",
  PREMIUM = "PREMIUM",
}
