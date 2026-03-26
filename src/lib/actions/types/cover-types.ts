// src/lib/actions/types/cover-types.ts

export interface CoverDTO {
  id: string;
  eventId: string;
  cashAmount: number;
  qrAmount: number;
  total: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface CreateCoverDTO {
  eventId: string;
  cashAmount: number;
  qrAmount: number;
}

export interface CoverFilters {
  eventId?: string;
}

export interface CoverStats {
  totalCovers: number;
  totalCash: number;
  totalQR: number;
  grandTotal: number;
}
