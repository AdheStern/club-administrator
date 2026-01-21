// src/lib/actions/types/event-types.ts

import type { Event } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface CreateEventDTO {
  name: string;
  description?: string;
  eventDate: Date;
  image?: string;
  paymentQR?: string;
  commissionAmount?: number;
  freeInvitationQRCount?: number;
  visibilityStart: Date;
  visibilityEnd: Date;
  sectorIds: string[];
  tableIds: string[];
}

export interface UpdateEventDTO {
  id: string;
  name?: string;
  description?: string;
  eventDate?: Date;
  image?: string;
  paymentQR?: string;
  commissionAmount?: number;
  freeInvitationQRCount?: number;
  visibilityStart?: Date;
  visibilityEnd?: Date;
  isActive?: boolean;
  sectorIds?: string[];
  tableIds?: string[];
}

export interface EventFilters {
  search?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export type EventWithRelations = Event & {
  eventSectors: Array<{
    id: string;
    sector: {
      id: string;
      name: string;
    };
  }>;
  eventTables: Array<{
    id: string;
    isBooked: boolean;
    table: {
      id: string;
      name: string;
      sectorId: string;
      sector: {
        id: string;
        name: string;
      };
    };
  }>;
  _count: {
    requests: number;
    eventSectors: number;
    eventTables: number;
  };
};

export type EventWithRelationsDTO = Omit<
  EventWithRelations,
  "commissionAmount"
> & {
  commissionAmount: number | null;
};
