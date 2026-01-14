// src/lib/actions/types/request-types.ts

import type { Request } from "@prisma/client";

export interface GuestData {
  name: string;
  identityCard: string;
  phone?: string;
  email?: string;
}

export interface CreateRequestDTO {
  eventId: string;
  tableId: string;
  packageId: string;
  clientData: GuestData;
  guestList: GuestData[];
  hasConsumption: boolean;
  extraGuests: number;
  termsAccepted: boolean;
  createdById: string;
}

export interface UpdateRequestDTO {
  id: string;
  clientData?: GuestData;
  guestList?: GuestData[];
  hasConsumption?: boolean;
  extraGuests?: number;
}

export interface ApproveRequestDTO {
  id: string;
  approvedById: string;
}

export interface ObserveRequestDTO {
  id: string;
  managerNotes: string;
  approvedById: string;
}

export interface RejectRequestDTO {
  id: string;
  managerNotes: string;
  approvedById: string;
}

export interface RequestFilters {
  search?: string;
  status?: string;
  eventId?: string;
  createdById?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type RequestWithRelations = Request & {
  event: {
    id: string;
    name: string;
    eventDate: Date;
    image: string | null;
  };
  table: {
    id: string;
    name: string;
    sector: {
      id: string;
      name: string;
    };
  };
  package: {
    id: string;
    name: string;
    includedPeople: number;
    basePrice: number;
    extraPersonPrice: number | null;
  };
  client: {
    id: string;
    name: string;
    identityCard: string;
    phone: string | null;
    email: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy: {
    id: string;
    name: string;
  } | null;
  guestInvitations: Array<{
    id: string;
    guest: {
      id: string;
      name: string;
      identityCard: string;
    };
  }>;
};

export enum RequestStatus {
  PENDING = "PENDING",
  OBSERVED = "OBSERVED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}
