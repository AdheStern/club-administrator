// src/lib/actions/request-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertDecimalsToNumbers } from "./helpers/decimal-converter";
import { GuestHelper } from "./helpers/guest-helper";
import * as QRGenerator from "./helpers/qr-generator";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  ApproveRequestDTO,
  CreateRequestDTO,
  MarkAsPaidDTO,
  ObserveRequestDTO,
  PreApproveRequestDTO,
  RejectRequestDTO,
  RequestFilters,
  RequestWithRelations,
  TransferTableDTO,
  UpdateRequestDTO,
} from "./types/request-types";

class RequestRepository {
  async create(dto: CreateRequestDTO) {
    const table = await db.table.findUnique({
      where: { id: dto.tableId },
      include: { sector: true },
    });

    if (!table) throw new Error("Mesa no encontrada");

    const client = await GuestHelper.findOrCreateGuest(dto.clientData);
    const guestIds: string[] = [];

    if (table.sector.requiresGuestList && dto.guestList) {
      for (const guestData of dto.guestList) {
        const guest = await GuestHelper.findOrCreateGuest(guestData);
        guestIds.push(guest.id);
      }
    }

    return db.request.create({
      data: {
        id: crypto.randomUUID(),
        eventId: dto.eventId,
        tableId: dto.tableId,
        packageId: dto.packageId,
        clientId: client.id,
        createdById: dto.createdById,
        hasConsumption: dto.hasConsumption,
        extraGuests: dto.extraGuests,
        termsAccepted: dto.termsAccepted,
        guestInvitations: {
          create: guestIds.map((guestId) => ({
            id: crypto.randomUUID(),
            guestId,
          })),
        },
      },
      include: this.getInclude(),
    });
  }

  async update(dto: UpdateRequestDTO) {
    const request = await db.request.findUnique({
      where: { id: dto.id },
      include: {
        table: { include: { sector: true } },
        guestInvitations: true,
      },
    });

    if (!request) throw new Error("Solicitud no encontrada");

    const client = await GuestHelper.findOrCreateGuest(dto.clientData);

    const updateData: {
      clientId: string;
      tableId?: string;
      packageId?: string;
      hasConsumption: boolean;
      extraGuests: number;
      updatedAt: Date;
    } = {
      clientId: client.id,
      hasConsumption: dto.hasConsumption,
      extraGuests: dto.extraGuests,
      updatedAt: new Date(),
    };

    if (dto.tableId) {
      updateData.tableId = dto.tableId;
    }

    if (dto.packageId) {
      updateData.packageId = dto.packageId;
    }

    const newTable = dto.tableId
      ? await db.table.findUnique({
          where: { id: dto.tableId },
          include: { sector: true },
        })
      : request.table;

    if (newTable?.sector.requiresGuestList && dto.guestList) {
      await db.guestInvitation.deleteMany({
        where: { requestId: dto.id },
      });

      for (const guestData of dto.guestList) {
        const guest = await GuestHelper.findOrCreateGuest(guestData);
        await db.guestInvitation.create({
          data: {
            id: crypto.randomUUID(),
            requestId: dto.id,
            guestId: guest.id,
          },
        });
      }
    }

    return db.request.update({
      where: { id: dto.id },
      data: updateData,
      include: this.getInclude(),
    });
  }

  async updateStatus(
    id: string,
    status: string,
    approvedById: string,
    notes?: string,
  ) {
    const request = await db.request.findUnique({ where: { id } });
    if (!request) throw new Error("Solicitud no encontrada");

    const reviewDuration = Math.floor(
      (Date.now() - new Date(request.createdAt).getTime()) / 1000,
    );

    return db.request.update({
      where: { id },
      data: {
        status,
        approvedById,
        managerNotes: notes,
        reviewDuration,
        ...(status === "PRE_APPROVED" && {
          isPreApproved: true,
          preApprovedAt: new Date(),
        }),
        ...(status === "APPROVED" && { approvedAt: new Date() }),
        updatedAt: new Date(),
      },
      include: this.getInclude(),
    });
  }

  async markAsPaid(id: string, paymentVoucherUrl?: string) {
    return db.request.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
        ...(paymentVoucherUrl && { paymentVoucherUrl }),
        updatedAt: new Date(),
      },
      include: this.getInclude(),
    });
  }

  async findById(id: string) {
    return db.request.findUnique({
      where: { id },
      include: this.getInclude(),
    });
  }

  async findMany(filters: RequestFilters, pagination: PaginationParams) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      ...(filters.status && { status: filters.status }),
      ...(filters.eventId && { eventId: filters.eventId }),
      ...(filters.createdById && { createdById: filters.createdById }),
    };

    if (filters.userIds && filters.userIds.length > 0) {
      where.createdById = { in: filters.userIds };
    }

    if (filters.search) {
      where.OR = [
        { client: { name: { contains: filters.search, mode: "insensitive" } } },
        {
          client: {
            identityCard: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom)
        (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters.dateTo)
        (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }

    const [data, total] = await Promise.all([
      db.request.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: this.getInclude(),
      }),
      db.request.count({ where }),
    ]);

    return {
      data: data.map((item) =>
        convertDecimalsToNumbers(item),
      ) as RequestWithRelations[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private getInclude() {
    return {
      event: {
        select: {
          id: true,
          name: true,
          eventDate: true,
          image: true,
          freeInvitationQRCount: true,
          paymentQR: true,
        },
      },
      table: {
        select: {
          id: true,
          name: true,
          sectorId: true,
          sector: {
            select: {
              id: true,
              name: true,
              requiresGuestList: true,
            },
          },
        },
      },
      package: true,
      client: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      guestInvitations: {
        include: {
          guest: true,
        },
      },
    };
  }
}

class RequestService {
  private repository = new RequestRepository();

  async createRequest(
    dto: CreateRequestDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      if (!dto.termsAccepted) {
        return {
          success: false,
          error: "Debe aceptar los términos y condiciones",
          code: "TERMS_NOT_ACCEPTED",
        };
      }

      const existingRequest = await db.request.findFirst({
        where: {
          eventId: dto.eventId,
          tableId: dto.tableId,
          status: { in: ["PENDING", "OBSERVED", "PRE_APPROVED", "APPROVED"] },
        },
      });

      if (existingRequest) {
        return {
          success: false,
          error: "La mesa ya tiene una solicitud activa",
          code: "TABLE_ALREADY_REQUESTED",
        };
      }

      const request = await this.repository.create(dto);
      revalidatePath("/requests");

      return {
        success: true,
        data: convertDecimalsToNumbers(request) as RequestWithRelations,
      };
    } catch {
      return {
        success: false,
        error: "Error al crear solicitud",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateRequest(
    dto: UpdateRequestDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(dto.id);
      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "NOT_FOUND",
        };
      }

      const updated = await this.repository.update(dto);
      revalidatePath("/requests");

      return {
        success: true,
        data: convertDecimalsToNumbers(updated) as RequestWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar solicitud",
        code: "UPDATE_ERROR",
      };
    }
  }

  async preApproveRequest(
    dto: PreApproveRequestDTO,
  ): Promise<
    ActionResult<{ request: RequestWithRelations; paymentQRUrl: string | null }>
  > {
    try {
      const request = await this.repository.findById(dto.id);
      if (!request || !["PENDING", "OBSERVED"].includes(request.status)) {
        return {
          success: false,
          error: "Solicitud no válida para pre-aprobar",
          code: "INVALID_STATUS",
        };
      }

      const updated = await this.repository.updateStatus(
        dto.id,
        "PRE_APPROVED",
        dto.approvedById,
      );

      revalidatePath("/requests");

      return {
        success: true,
        data: {
          request: convertDecimalsToNumbers(updated) as RequestWithRelations,
          paymentQRUrl: updated.event.paymentQR
            ? `/uploads/${updated.event.paymentQR}`
            : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al pre-aprobar",
        code: "PRE_APPROVE_ERROR",
      };
    }
  }

  async markAsPaid(
    dto: MarkAsPaidDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(dto.id);
      if (!request || request.status !== "PRE_APPROVED") {
        return {
          success: false,
          error: "Solo se pueden marcar como pagadas solicitudes pre-aprobadas",
          code: "INVALID_STATUS",
        };
      }

      const updated = await this.repository.markAsPaid(
        dto.id,
        dto.paymentVoucherUrl,
      );
      revalidatePath("/requests");

      return {
        success: true,
        data: convertDecimalsToNumbers(updated) as RequestWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al marcar como pagada",
        code: "MARK_PAID_ERROR",
      };
    }
  }

  async approveRequest(dto: ApproveRequestDTO): Promise<
    ActionResult<{
      request: RequestWithRelations;
      qrPDFContent: string;
      freeQRPDFContent: string | null;
    }>
  > {
    try {
      const request = await this.repository.findById(dto.id);
      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "NOT_FOUND",
        };
      }

      if (request.status === "PRE_APPROVED" && !request.isPaid) {
        return {
          success: false,
          error: "Debe marcar como pagada antes de aprobar",
          code: "NOT_PAID",
        };
      }

      if (!["PENDING", "OBSERVED", "PRE_APPROVED"].includes(request.status)) {
        return {
          success: false,
          error: "Estado inválido",
          code: "INVALID_STATUS",
        };
      }

      const updated = await this.repository.updateStatus(
        dto.id,
        "APPROVED",
        dto.approvedById,
      );

      const requiresGuestList = updated.table.sector.requiresGuestList;
      const totalPeople = updated.package.includedPeople + updated.extraGuests;

      let qrPDFContent: string;
      let freeQRPDFContent: string | null = null;

      if (requiresGuestList) {
        const allGuestIds = [
          updated.clientId,
          ...updated.guestInvitations.map((gi) => gi.guest.id),
        ];

        await GuestHelper.incrementEventsAttended(allGuestIds);

        const qrEntries = await QRGenerator.createQREntries(
          dto.id,
          allGuestIds,
          {
            name: updated.event.name,
            eventDate: updated.event.eventDate,
            tableName: updated.table.name,
            sectorName: updated.table.sector.name,
          },
        );

        qrPDFContent = await QRGenerator.generateQRPDFContent(qrEntries);
      } else {
        const anonymousQRs = await QRGenerator.createAnonymousQREntries(
          dto.id,
          totalPeople,
          {
            name: updated.event.name,
            eventDate: updated.event.eventDate,
            tableName: updated.table.name,
            sectorName: updated.table.sector.name,
          },
        );

        qrPDFContent =
          await QRGenerator.generateAnonymousQRPDFContent(anonymousQRs);
      }

      if (updated.event.freeInvitationQRCount > 0) {
        const freeQRs = await QRGenerator.createAnonymousQREntries(
          dto.id,
          updated.event.freeInvitationQRCount,
          {
            name: updated.event.name,
            eventDate: updated.event.eventDate,
            tableName: updated.table.name,
            sectorName: updated.table.sector.name,
          },
        );

        freeQRPDFContent = await QRGenerator.generateFreeQRPDFContent(freeQRs);
      }

      revalidatePath("/requests");

      return {
        success: true,
        data: {
          request: convertDecimalsToNumbers(updated) as RequestWithRelations,
          qrPDFContent,
          freeQRPDFContent,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al aprobar",
        code: "APPROVE_ERROR",
      };
    }
  }

  async observeRequest(
    dto: ObserveRequestDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(dto.id);
      if (!request || request.status !== "PENDING") {
        return {
          success: false,
          error: "Estado inválido",
          code: "INVALID_STATUS",
        };
      }

      const updated = await this.repository.updateStatus(
        dto.id,
        "OBSERVED",
        dto.approvedById,
        dto.managerNotes,
      );

      revalidatePath("/requests");
      return {
        success: true,
        data: convertDecimalsToNumbers(updated) as RequestWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al observar",
        code: "OBSERVE_ERROR",
      };
    }
  }

  async rejectRequest(
    dto: RejectRequestDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(dto.id);
      if (
        !request ||
        !["PENDING", "OBSERVED", "PRE_APPROVED"].includes(request.status)
      ) {
        return {
          success: false,
          error: "Estado inválido",
          code: "INVALID_STATUS",
        };
      }

      const updated = await this.repository.updateStatus(
        dto.id,
        "REJECTED",
        dto.approvedById,
        dto.managerNotes,
      );

      revalidatePath("/requests");
      return {
        success: true,
        data: convertDecimalsToNumbers(updated) as RequestWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al rechazar",
        code: "REJECT_ERROR",
      };
    }
  }

  async getRequestById(
    id: string,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(id);
      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: convertDecimalsToNumbers(request) as RequestWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener solicitud",
        code: "FETCH_ERROR",
      };
    }
  }

  async getRequestsByUserRole(
    userId: string,
    userRole: string,
    filters: RequestFilters = {},
    pagination: PaginationParams = {},
  ): Promise<ActionResult<PaginatedResult<RequestWithRelations>>> {
    try {
      const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole);
      const isSupervisor = userRole === "SUPERVISOR";

      let userIdsFilter: string[] = [];

      if (isManager) {
        // Admins y managers ven todas las solicitudes
      } else if (isSupervisor) {
        const subordinates = await db.user.findMany({
          where: { managerId: userId },
          select: { id: true },
        });

        userIdsFilter = [userId, ...subordinates.map((s) => s.id)];
      } else {
        userIdsFilter = [userId];
      }

      const updatedFilters = {
        ...filters,
        ...(userIdsFilter.length > 0 && { userIds: userIdsFilter }),
      };

      const result = await this.repository.findMany(updatedFilters, pagination);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener solicitudes",
        code: "FETCH_ERROR",
      };
    }
  }

  async getRequests(
    filters: RequestFilters = {},
    pagination: PaginationParams = {},
  ): Promise<ActionResult<PaginatedResult<RequestWithRelations>>> {
    try {
      const result = await this.repository.findMany(filters, pagination);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener solicitudes",
        code: "FETCH_ERROR",
      };
    }
  }

  async downloadRequestQRs(requestId: string): Promise<
    ActionResult<{
      qrPDFContent: string;
      freeQRPDFContent: string | null;
      fileName: string;
    }>
  > {
    try {
      const request = await db.request.findUnique({
        where: { id: requestId },
        include: {
          event: true,
          table: { include: { sector: true } },
          package: true,
          client: true,
          guestInvitations: { include: { guest: true } },
        },
      });

      if (!request || request.status !== "APPROVED") {
        return {
          success: false,
          error: "Solicitud no encontrada o no aprobada",
          code: "NOT_APPROVED",
        };
      }

      const qrEntries = await db.qREntry.findMany({
        where: { requestId },
        include: { guest: true },
      });

      if (!qrEntries.length) {
        return {
          success: false,
          error: "No se encontraron códigos QR",
          code: "NO_QR_FOUND",
        };
      }

      const requiresGuestList = request.table.sector.requiresGuestList;
      let qrPDFContent: string;
      let freeQRPDFContent: string | null = null;

      if (requiresGuestList) {
        const qrData = qrEntries
          .filter((qr) => !qr.guest.identityCard.startsWith("TEMP-"))
          .map((qr) => ({
            code: qr.code,
            guestName: qr.guest.name,
            guestIdentityCard: qr.guest.identityCard,
            eventName: request.event.name,
            eventDate: request.event.eventDate,
            tableName: request.table.name,
            sectorName: request.table.sector.name,
          }));

        qrPDFContent = await QRGenerator.generateQRPDFContent(qrData);
      } else {
        const totalPeople =
          request.package.includedPeople + request.extraGuests;
        const anonymousQRData = qrEntries
          .slice(0, totalPeople)
          .map((qr, index) => ({
            code: qr.code,
            eventName: request.event.name,
            eventDate: request.event.eventDate,
            tableName: request.table.name,
            sectorName: request.table.sector.name,
            qrNumber: index + 1,
            totalQRs: totalPeople,
          }));

        qrPDFContent =
          await QRGenerator.generateAnonymousQRPDFContent(anonymousQRData);
      }

      if (request.event.freeInvitationQRCount > 0) {
        const freeQREntries = qrEntries.slice(
          -request.event.freeInvitationQRCount,
        );
        const freeQRData = freeQREntries.map((qr, index) => ({
          code: qr.code,
          eventName: request.event.name,
          eventDate: request.event.eventDate,
          tableName: request.table.name,
          sectorName: request.table.sector.name,
          qrNumber: index + 1,
          totalQRs: request.event.freeInvitationQRCount,
        }));

        freeQRPDFContent =
          await QRGenerator.generateFreeQRPDFContent(freeQRData);
      }

      return {
        success: true,
        data: {
          qrPDFContent,
          freeQRPDFContent,
          fileName: `QR-${request.event.name}-${request.client.name}`,
        },
      };
    } catch {
      return {
        success: false,
        error: "Error al generar códigos QR",
        code: "GENERATION_ERROR",
      };
    }
  }

  async getAvailableTablesForEvent(
    eventId: string,
    userId?: string,
  ): Promise<
    ActionResult<
      Array<{
        id: string;
        name: string;
        sectorId: string;
        sectorName: string;
        requiresGuestList: boolean;
      }>
    >
  > {
    try {
      let userSectors: string[] | undefined;

      if (userId) {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            userSectors: {
              select: {
                sectorId: true,
              },
            },
          },
        });

        const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
          user?.role || "",
        );

        if (!isManager && user?.userSectors) {
          userSectors = user.userSectors.map((us) => us.sectorId);
        }
      }

      const eventTables = await db.eventTable.findMany({
        where: {
          eventId,
          ...(userSectors && {
            table: {
              sectorId: {
                in: userSectors,
              },
            },
          }),
        },
        include: {
          table: {
            include: {
              sector: {
                select: {
                  id: true,
                  name: true,
                  requiresGuestList: true,
                },
              },
            },
          },
        },
      });

      const activeRequests = await db.request.findMany({
        where: {
          eventId,
          status: { in: ["PENDING", "OBSERVED", "PRE_APPROVED", "APPROVED"] },
        },
        select: {
          tableId: true,
        },
      });

      const requestedTableIds = new Set(
        activeRequests.map((req) => req.tableId),
      );

      const availableTables = eventTables
        .filter((et) => !requestedTableIds.has(et.tableId))
        .map((et) => ({
          id: et.table.id,
          name: et.table.name,
          sectorId: et.table.sector.id,
          sectorName: et.table.sector.name,
          requiresGuestList: et.table.sector.requiresGuestList,
        }));

      console.log("Available tables:", availableTables);

      return {
        success: true,
        data: availableTables,
      };
    } catch (error) {
      console.error("Error fetching available tables:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener mesas disponibles",
        code: "FETCH_ERROR",
      };
    }
  }

  async transferTable(
    dto: TransferTableDTO,
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const request = await this.repository.findById(dto.id);

      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "NOT_FOUND",
        };
      }

      if (request.status === "APPROVED" || request.status === "REJECTED") {
        return {
          success: false,
          error: "No se puede transferir una solicitud aprobada o rechazada",
          code: "INVALID_STATUS",
        };
      }

      const newTable = await db.table.findUnique({
        where: { id: dto.newTableId },
        include: { sector: true },
      });

      if (!newTable) {
        return {
          success: false,
          error: "Mesa no encontrada",
          code: "NOT_FOUND",
        };
      }

      if (newTable.sector.id !== request.table.sector.id) {
        return {
          success: false,
          error: "Solo se puede transferir a mesas del mismo sector",
          code: "DIFFERENT_SECTOR",
        };
      }

      const eventTable = await db.eventTable.findUnique({
        where: {
          eventId_tableId: {
            eventId: request.eventId,
            tableId: dto.newTableId,
          },
        },
      });

      if (!eventTable) {
        return {
          success: false,
          error: "La mesa no está disponible para este evento",
          code: "TABLE_NOT_AVAILABLE",
        };
      }

      if (eventTable.isBooked && eventTable.tableId !== request.tableId) {
        return {
          success: false,
          error: "La mesa ya está reservada",
          code: "TABLE_ALREADY_BOOKED",
        };
      }

      const existingRequest = await db.request.findFirst({
        where: {
          eventId: request.eventId,
          tableId: dto.newTableId,
          status: { in: ["PENDING", "OBSERVED", "PRE_APPROVED", "APPROVED"] },
          id: { not: dto.id },
        },
      });

      if (existingRequest) {
        return {
          success: false,
          error: "La mesa ya tiene una solicitud activa",
          code: "TABLE_HAS_ACTIVE_REQUEST",
        };
      }

      const updatedRequest = await db.$transaction(async (tx) => {
        await tx.eventTable.update({
          where: {
            eventId_tableId: {
              eventId: request.eventId,
              tableId: request.tableId,
            },
          },
          data: { isBooked: false },
        });

        await tx.eventTable.update({
          where: {
            eventId_tableId: {
              eventId: request.eventId,
              tableId: dto.newTableId,
            },
          },
          data: { isBooked: true },
        });

        return tx.request.update({
          where: { id: dto.id },
          data: {
            tableId: dto.newTableId,
            updatedAt: new Date(),
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                eventDate: true,
                image: true,
                freeInvitationQRCount: true,
                paymentQR: true,
              },
            },
            table: {
              select: {
                id: true,
                name: true,
                sectorId: true,
                sector: {
                  select: {
                    id: true,
                    name: true,
                    requiresGuestList: true,
                  },
                },
              },
            },
            package: true,
            client: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            guestInvitations: {
              include: { guest: true },
            },
          },
        });
      });

      revalidatePath("/requests");

      return {
        success: true,
        data: convertDecimalsToNumbers(updatedRequest) as RequestWithRelations,
      };
    } catch {
      return {
        success: false,
        error: "Error al transferir mesa",
        code: "TRANSFER_ERROR",
      };
    }
  }
}

const requestService = new RequestService();

export async function createRequest(dto: CreateRequestDTO) {
  return requestService.createRequest(dto);
}

export async function updateRequest(dto: UpdateRequestDTO) {
  return requestService.updateRequest(dto);
}

export async function preApproveRequest(dto: PreApproveRequestDTO) {
  return requestService.preApproveRequest(dto);
}

export async function markAsPaid(dto: MarkAsPaidDTO) {
  return requestService.markAsPaid(dto);
}

export async function approveRequest(dto: ApproveRequestDTO) {
  return requestService.approveRequest(dto);
}

export async function observeRequest(dto: ObserveRequestDTO) {
  return requestService.observeRequest(dto);
}

export async function rejectRequest(dto: RejectRequestDTO) {
  return requestService.rejectRequest(dto);
}

export async function getRequestById(id: string) {
  return requestService.getRequestById(id);
}

export async function getRequestsByUserRole(
  userId: string,
  userRole: string,
  filters?: RequestFilters,
  pagination?: PaginationParams,
) {
  return requestService.getRequestsByUserRole(
    userId,
    userRole,
    filters,
    pagination,
  );
}

export async function getRequests(
  filters?: RequestFilters,
  pagination?: PaginationParams,
) {
  return requestService.getRequests(filters, pagination);
}

export async function downloadRequestQRs(requestId: string) {
  return requestService.downloadRequestQRs(requestId);
}

export async function getAvailableTablesForEvent(
  eventId: string,
  userId?: string,
) {
  return requestService.getAvailableTablesForEvent(eventId, userId);
}

export async function transferTable(dto: TransferTableDTO) {
  return requestService.transferTable(dto);
}
