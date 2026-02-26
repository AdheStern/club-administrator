// src/lib/actions/types/bulk-invitation-types.ts

import type { GuestData } from "./request-types";

export interface BulkInvitationItemDTO {
  sectorId: string;
  tableId: string;
  packageId: string;
  extraGuests: number;
  clientData: GuestData;
  guestList: GuestData[];
}

export interface CreateBulkInvitationsDTO {
  eventId: string;
  createdById: string;
  invitations: BulkInvitationItemDTO[];
}

export interface BulkInvitationResult {
  succeeded: number;
  failed: number;
  errors: string[];
  qrPDFContents: string[];
}
