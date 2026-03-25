// src/lib/actions/types/guest-types.ts

import type { Guest } from "@prisma/client";

export interface GuestDTO {
  id: string;
  name: string;
  identityCard: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
  loyaltyPoints: number;
  eventsAttended: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuestWithStats extends GuestDTO {
  _count: {
    requestsAsClient: number;
    qrEntries: number;
  };
}

export interface CreateGuestDTO {
  name: string;
  identityCard: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
}

export interface UpdateGuestDTO {
  id: string;
  name?: string;
  identityCard?: string;
  phone?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
}

export interface GuestFilters {
  search?: string;
}

export type GuestSortField =
  | "name"
  | "identityCard"
  | "loyaltyPoints"
  | "eventsAttended"
  | "createdAt";
export type SortDirection = "asc" | "desc";

export interface GuestSortParams {
  field: GuestSortField;
  direction: SortDirection;
}

export type GuestFromPrisma = Guest & {
  _count: {
    requestsAsClient: number;
    qrEntries: number;
  };
};
