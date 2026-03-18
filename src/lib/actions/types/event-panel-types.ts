// src/lib/actions/types/event-panel-types.ts

export interface EventOptionDTO {
  id: string;
  name: string;
  eventDate: string;
}

export interface EventPanelKPIs {
  approvedRequests: number;
  totalQRGenerated: number;
  totalQRScanned: number;
  totalQRPending: number;
  totalRevenue: number;
  regularQRGenerated: number;
  regularQRScanned: number;
  regularQRPending: number;
  invitationQRGenerated: number;
  invitationQRScanned: number;
  invitationQRPending: number;
  avgApprovalMinutes: number | null;
}

export interface SectorAvailabilityDTO {
  sectorId: string;
  sectorName: string;
  totalTables: number;
  bookedTables: number;
  freeTables: number;
  occupancyPercent: number;
}

export interface QRByPackageDTO {
  packageId: string;
  packageName: string;
  packageColor: string;
  isInvitation: boolean;
  regularCount: number;
  invitationCount: number;
}

export interface TopUserDTO {
  userId: string;
  userName: string;
  userEmail: string;
  requestCount: number;
}

export interface RecentRequestDTO {
  id: string;
  clientName: string;
  packageName: string;
  sectorName: string;
  tableName: string;
  status: string;
  isPaid: boolean;
  createdAt: string;
}

export interface SectorActivityDTO {
  sectorName: string;
  requestCount: number;
}

export interface SectorRadarDTO {
  sectorName: string;
  solicitudes: number;
  ocupacion: number;
  aprobadas: number;
}

export interface EventPanelData {
  event: EventOptionDTO;
  kpis: EventPanelKPIs;
  sectorAvailability: SectorAvailabilityDTO[];
  qrByPackage: QRByPackageDTO[];
  topUsers: TopUserDTO[];
  recentRequests: RecentRequestDTO[];
  sectorActivity: SectorActivityDTO[];
  sectorRadar: SectorRadarDTO[];
  paymentConversionRate: number;
  overallOccupancy: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
