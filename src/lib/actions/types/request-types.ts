// src/lib/actions/types/request-types.ts

import type { Decimal } from "@prisma/client/runtime/library";

export interface GuestData {
  name: string;
  identityCard: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
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
  tableId?: string;
  packageId?: string;
  clientData: GuestData;
  guestList: GuestData[];
  hasConsumption: boolean;
  extraGuests: number;
}

export interface PreApproveRequestDTO {
  id: string;
  approvedById: string;
}

export interface MarkAsPaidDTO {
  id: string;
  paymentVoucherUrl?: string;
}

export interface ApproveRequestDTO {
  id: string;
  approvedById: string;
}

export interface ObserveRequestDTO {
  id: string;
  approvedById: string;
  managerNotes: string;
}

export interface RejectRequestDTO {
  id: string;
  approvedById: string;
  managerNotes: string;
}

export interface TransferTableDTO {
  id: string;
  newTableId: string;
}

export interface RequestFilters {
  status?: string;
  eventId?: string;
  createdById?: string;
  userIds?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface RequestWithRelations {
  id: string;
  eventId: string;
  tableId: string;
  packageId: string;
  clientId: string;
  createdById: string;
  status: string;
  hasConsumption: boolean;
  isPaid: boolean;
  isPreApproved: boolean;
  extraGuests: number;
  termsAccepted: boolean;
  managerNotes: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  preApprovedAt: Date | null;
  paidAt: Date | null;
  paymentVoucherUrl: string | null;
  reviewDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    name: string;
    eventDate: Date;
    image: string | null;
    freeInvitationQRCount: number;
    paymentQR: string | null;
  };
  table: {
    id: string;
    name: string;
    sectorId: string;
    sector: {
      id: string;
      name: string;
      requiresGuestList: boolean;
    };
  };
  package: {
    id: string;
    name: string;
    description: string | null;
    includedPeople: number;
    basePrice: number | Decimal;
    extraPersonPrice: number | Decimal | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  client: {
    id: string;
    name: string;
    identityCard: string;
    phone: string | null;
    email: string | null;
    instagramHandle: string | null;
    loyaltyPoints: number;
    eventsAttended: number;
    createdAt: Date;
    updatedAt: Date;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  approvedBy: {
    id: string;
    name: string;
  } | null;
  guestInvitations: Array<{
    id: string;
    requestId: string;
    guestId: string;
    createdAt: Date;
    guest: {
      id: string;
      name: string;
      identityCard: string;
      phone: string | null;
      email: string | null;
      instagramHandle: string | null;
      loyaltyPoints: number;
      eventsAttended: number;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}
