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
  ObserveRequestDTO,
  RejectRequestDTO,
  RequestFilters,
  RequestWithRelations,
  UpdateRequestDTO,
} from "./types/request-types";

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class TableAvailabilityValidationStrategy implements ValidationStrategy {
  async validate(data: {
    tableId: string;
    eventId: string;
    excludeRequestId?: string;
  }): Promise<ActionResult<void>> {
    const eventTable = await db.eventTable.findUnique({
      where: {
        eventId_tableId: {
          eventId: data.eventId,
          tableId: data.tableId,
        },
      },
    });

    if (!eventTable) {
      return {
        success: false,
        error: "La mesa no está disponible para este evento",
        code: "TABLE_NOT_IN_EVENT",
      };
    }

    const existingRequest = await db.request.findFirst({
      where: {
        eventId: data.eventId,
        tableId: data.tableId,
        status: { in: ["PENDING", "OBSERVED", "APPROVED"] },
        ...(data.excludeRequestId && { id: { not: data.excludeRequestId } }),
      },
    });

    if (existingRequest) {
      return {
        success: false,
        error: "La mesa ya tiene una solicitud activa para este evento",
        code: "TABLE_ALREADY_REQUESTED",
      };
    }

    return { success: true };
  }
}

class RejectedGuestValidationStrategy implements ValidationStrategy {
  async validate(data: {
    eventId: string;
    identityCards: string[];
  }): Promise<ActionResult<void>> {
    const rejectedRequests = await db.request.findMany({
      where: {
        eventId: data.eventId,
        status: "REJECTED",
      },
      include: {
        client: true,
        guestInvitations: {
          include: {
            guest: true,
          },
        },
      },
    });

    const rejectedIdentityCards = new Set<string>();

    for (const request of rejectedRequests) {
      rejectedIdentityCards.add(request.client.identityCard);
      for (const invitation of request.guestInvitations) {
        rejectedIdentityCards.add(invitation.guest.identityCard);
      }
    }

    const foundRejected = data.identityCards.filter((ic) =>
      rejectedIdentityCards.has(ic)
    );

    if (foundRejected.length > 0) {
      return {
        success: false,
        error: `Los siguientes carnets están en solicitudes rechazadas: ${foundRejected.join(
          ", "
        )}`,
        code: "GUEST_IN_REJECTED_REQUEST",
      };
    }

    return { success: true };
  }
}

class TermsAcceptedValidationStrategy implements ValidationStrategy {
  async validate(termsAccepted: boolean): Promise<ActionResult<void>> {
    if (!termsAccepted) {
      return {
        success: false,
        error: "Debe aceptar los términos y condiciones",
        code: "TERMS_NOT_ACCEPTED",
      };
    }

    return { success: true };
  }
}

class RequestRepository {
  async create(data: CreateRequestDTO): Promise<RequestWithRelations> {
    const client = await GuestHelper.findOrCreateGuest(data.clientData);

    const guestIds: string[] = [];
    for (const guestData of data.guestList) {
      const guest = await GuestHelper.findOrCreateGuest(guestData);
      guestIds.push(guest.id);
    }

    const result = await db.request.create({
      data: {
        id: crypto.randomUUID(),
        eventId: data.eventId,
        tableId: data.tableId,
        packageId: data.packageId,
        clientId: client.id,
        createdById: data.createdById,
        hasConsumption: data.hasConsumption,
        extraGuests: data.extraGuests,
        termsAccepted: data.termsAccepted,
        createdAt: new Date(),
        updatedAt: new Date(),
        guestInvitations: {
          create: guestIds.map((guestId) => ({
            id: crypto.randomUUID(),
            guestId,
            createdAt: new Date(),
          })),
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            includedPeople: true,
            basePrice: true,
            extraPersonPrice: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            identityCard: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
            guest: {
              select: {
                id: true,
                name: true,
                identityCard: true,
              },
            },
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as RequestWithRelations;
  }

  async update(
    id: string,
    data: UpdateRequestDTO
  ): Promise<RequestWithRelations> {
    let clientId: string | undefined;

    if (data.clientData) {
      const client = await GuestHelper.findOrCreateGuest(data.clientData);
      clientId = client.id;
    }

    if (data.guestList) {
      await db.guestInvitation.deleteMany({
        where: { requestId: id },
      });

      const guestIds: string[] = [];
      for (const guestData of data.guestList) {
        const guest = await GuestHelper.findOrCreateGuest(guestData);
        guestIds.push(guest.id);
      }

      await db.guestInvitation.createMany({
        data: guestIds.map((guestId) => ({
          id: crypto.randomUUID(),
          requestId: id,
          guestId,
          createdAt: new Date(),
        })),
      });
    }

    const result = await db.request.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        ...(data.hasConsumption !== undefined && {
          hasConsumption: data.hasConsumption,
        }),
        ...(data.extraGuests !== undefined && {
          extraGuests: data.extraGuests,
        }),
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            includedPeople: true,
            basePrice: true,
            extraPersonPrice: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            identityCard: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
            guest: {
              select: {
                id: true,
                name: true,
                identityCard: true,
              },
            },
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as RequestWithRelations;
  }

  async approve(
    id: string,
    approvedById: string
  ): Promise<{ request: RequestWithRelations; qrPDFContent: string }> {
    const createdRequest = await db.request.findUnique({ where: { id } });

    if (!createdRequest) {
      throw new Error("Solicitud no encontrada");
    }

    const result = await db.request.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
        reviewDuration: Math.floor(
          (Date.now() - new Date(createdRequest.createdAt).getTime()) / 1000
        ),
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
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
      },
    });

    const allGuestIds = [
      result.clientId,
      ...result.guestInvitations.map((gi) => gi.guest.id),
    ];

    await GuestHelper.incrementEventsAttended(allGuestIds);

    const qrEntries = await QRGenerator.createQREntries(id, allGuestIds, {
      name: result.event.name,
      eventDate: result.event.eventDate,
      tableName: result.table.name,
      sectorName: result.table.sector.name,
    });

    const qrPDFContent = await QRGenerator.generateQRPDFContent(qrEntries);

    return {
      request: convertDecimalsToNumbers(result) as RequestWithRelations,
      qrPDFContent,
    };
  }

  async observe(
    id: string,
    approvedById: string,
    notes: string
  ): Promise<RequestWithRelations> {
    const createdRequest = await db.request.findUnique({ where: { id } });

    if (!createdRequest) {
      throw new Error("Solicitud no encontrada");
    }

    const result = await db.request.update({
      where: { id },
      data: {
        status: "OBSERVED",
        approvedById,
        managerNotes: notes,
        reviewDuration: Math.floor(
          (Date.now() - new Date(createdRequest.createdAt).getTime()) / 1000
        ),
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            includedPeople: true,
            basePrice: true,
            extraPersonPrice: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            identityCard: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
            guest: {
              select: {
                id: true,
                name: true,
                identityCard: true,
              },
            },
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as RequestWithRelations;
  }

  async reject(
    id: string,
    approvedById: string,
    notes: string
  ): Promise<RequestWithRelations> {
    const createdRequest = await db.request.findUnique({ where: { id } });

    if (!createdRequest) {
      throw new Error("Solicitud no encontrada");
    }

    const result = await db.request.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedById,
        managerNotes: notes,
        reviewDuration: Math.floor(
          (Date.now() - new Date(createdRequest.createdAt).getTime()) / 1000
        ),
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            includedPeople: true,
            basePrice: true,
            extraPersonPrice: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            identityCard: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
            guest: {
              select: {
                id: true,
                name: true,
                identityCard: true,
              },
            },
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as RequestWithRelations;
  }

  async findById(id: string): Promise<RequestWithRelations | null> {
    const result = await db.request.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            image: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            includedPeople: true,
            basePrice: true,
            extraPersonPrice: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            identityCard: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
            guest: {
              select: {
                id: true,
                name: true,
                identityCard: true,
              },
            },
          },
        },
      },
    });

    if (!result) return null;
    return convertDecimalsToNumbers(result) as RequestWithRelations;
  }

  async findMany(
    filters: RequestFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<RequestWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where: {
      status?: string;
      eventId?: string;
      createdById?: string;
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<{
        client?: {
          name?: { contains: string; mode: "insensitive" };
          identityCard?: { contains: string; mode: "insensitive" };
        };
        event?: { name?: { contains: string; mode: "insensitive" } };
      }>;
    } = {
      ...(filters.status && { status: filters.status }),
      ...(filters.eventId && { eventId: filters.eventId }),
      ...(filters.createdById && { createdById: filters.createdById }),
    };

    if (filters.search) {
      where.OR = [
        {
          client: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          client: {
            identityCard: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          event: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [data, total] = await Promise.all([
      db.request.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              eventDate: true,
              image: true,
            },
          },
          table: {
            select: {
              id: true,
              name: true,
              sector: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              includedPeople: true,
              basePrice: true,
              extraPersonPrice: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              identityCard: true,
              phone: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
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
              guest: {
                select: {
                  id: true,
                  name: true,
                  identityCard: true,
                },
              },
            },
          },
        },
      }),
      db.request.count({ where }),
    ]);

    const convertedData = data.map((item) =>
      convertDecimalsToNumbers(item)
    ) as RequestWithRelations[];

    return {
      data: convertedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAvailableTablesForEvent(eventId: string): Promise<
    Array<{
      id: string;
      name: string;
      sectorId: string;
      sectorName: string;
    }>
  > {
    const eventTables = await db.eventTable.findMany({
      where: { eventId },
      include: {
        table: {
          include: {
            sector: true,
          },
        },
      },
    });

    const activeRequestTableIds = await db.request.findMany({
      where: {
        eventId,
        status: { in: ["PENDING", "OBSERVED", "APPROVED"] },
      },
      select: { tableId: true },
    });

    const bookedTableIds = new Set(activeRequestTableIds.map((r) => r.tableId));

    return eventTables
      .filter((et) => !bookedTableIds.has(et.tableId))
      .map((et) => ({
        id: et.table.id,
        name: et.table.name,
        sectorId: et.table.sector.id,
        sectorName: et.table.sector.name,
      }));
  }
}

class RequestService {
  private repository = new RequestRepository();
  private tableValidation = new TableAvailabilityValidationStrategy();
  private rejectedGuestValidation = new RejectedGuestValidationStrategy();
  private termsValidation = new TermsAcceptedValidationStrategy();

  async createRequest(
    dto: CreateRequestDTO
  ): Promise<ActionResult<RequestWithRelations>> {
    try {
      const termsValidation = await this.termsValidation.validate(
        dto.termsAccepted
      );

      if (!termsValidation.success) {
        return termsValidation as ActionResult<RequestWithRelations>;
      }

      const tableValidation = await this.tableValidation.validate({
        tableId: dto.tableId,
        eventId: dto.eventId,
      });

      if (!tableValidation.success) {
        return tableValidation as ActionResult<RequestWithRelations>;
      }

      const allIdentityCards = [
        dto.clientData.identityCard,
        ...dto.guestList.map((g) => g.identityCard),
      ];

      const rejectedValidation = await this.rejectedGuestValidation.validate({
        eventId: dto.eventId,
        identityCards: allIdentityCards,
      });

      if (!rejectedValidation.success) {
        return rejectedValidation as ActionResult<RequestWithRelations>;
      }

      const request = await this.repository.create(dto);

      revalidatePath("/requests");

      return {
        success: true,
        data: request,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al crear solicitud",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateRequest(
    dto: UpdateRequestDTO
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

      if (request.status !== "PENDING" && request.status !== "OBSERVED") {
        return {
          success: false,
          error: "Solo se pueden editar solicitudes pendientes u observadas",
          code: "INVALID_STATUS",
        };
      }

      if (dto.guestList) {
        const allIdentityCards = [
          dto.clientData?.identityCard ?? request.client.identityCard,
          ...dto.guestList.map((g) => g.identityCard),
        ];

        const rejectedValidation = await this.rejectedGuestValidation.validate({
          eventId: request.eventId,
          identityCards: allIdentityCards,
        });

        if (!rejectedValidation.success) {
          return rejectedValidation as ActionResult<RequestWithRelations>;
        }
      }

      const updatedRequest = await this.repository.update(dto.id, dto);

      revalidatePath("/requests");

      return {
        success: true,
        data: updatedRequest,
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

  async approveRequest(
    dto: ApproveRequestDTO
  ): Promise<
    ActionResult<{ request: RequestWithRelations; qrPDFContent: string }>
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

      if (request.status !== "PENDING" && request.status !== "OBSERVED") {
        return {
          success: false,
          error: "Solo se pueden aprobar solicitudes pendientes u observadas",
          code: "INVALID_STATUS",
        };
      }

      const result = await this.repository.approve(dto.id, dto.approvedById);

      revalidatePath("/requests");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al aprobar solicitud",
        code: "APPROVE_ERROR",
      };
    }
  }

  async observeRequest(
    dto: ObserveRequestDTO
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

      if (request.status !== "PENDING") {
        return {
          success: false,
          error: "Solo se pueden observar solicitudes pendientes",
          code: "INVALID_STATUS",
        };
      }

      const observedRequest = await this.repository.observe(
        dto.id,
        dto.approvedById,
        dto.managerNotes
      );

      revalidatePath("/requests");

      return {
        success: true,
        data: observedRequest,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al observar solicitud",
        code: "OBSERVE_ERROR",
      };
    }
  }

  async rejectRequest(
    dto: RejectRequestDTO
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

      if (request.status !== "PENDING" && request.status !== "OBSERVED") {
        return {
          success: false,
          error: "Solo se pueden rechazar solicitudes pendientes u observadas",
          code: "INVALID_STATUS",
        };
      }

      const rejectedRequest = await this.repository.reject(
        dto.id,
        dto.approvedById,
        dto.managerNotes
      );

      revalidatePath("/requests");

      return {
        success: true,
        data: rejectedRequest,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al rechazar solicitud",
        code: "REJECT_ERROR",
      };
    }
  }

  async getRequestById(
    id: string
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
        data: request,
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

  async getRequests(
    filters: RequestFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ActionResult<PaginatedResult<RequestWithRelations>>> {
    try {
      const result = await this.repository.findMany(filters, pagination);

      return {
        success: true,
        data: result,
      };
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

  async downloadRequestQRs(
    requestId: string
  ): Promise<ActionResult<{ qrPDFContent: string; fileName: string }>> {
    try {
      const request = await db.request.findUnique({
        where: { id: requestId },
        include: {
          event: {
            select: {
              name: true,
              eventDate: true,
            },
          },
          table: {
            select: {
              name: true,
              sector: {
                select: {
                  name: true,
                },
              },
            },
          },
          client: true,
          guestInvitations: {
            include: {
              guest: true,
            },
          },
        },
      });

      if (!request || request.status !== "APPROVED") {
        return {
          success: false,
          error: "Solicitud no encontrada o no está aprobada",
          code: "NOT_APPROVED",
        };
      }

      const qrEntries = await db.qREntry.findMany({
        where: { requestId },
        include: {
          guest: true,
        },
      });

      if (!qrEntries || qrEntries.length === 0) {
        return {
          success: false,
          error: "No se encontraron códigos QR para esta solicitud",
          code: "NO_QR_FOUND",
        };
      }

      const qrData = qrEntries.map((qr) => ({
        code: qr.code,
        guestName: qr.guest.name,
        guestIdentityCard: qr.guest.identityCard,
        eventName: request.event.name,
        eventDate: request.event.eventDate,
        tableName: request.table.name,
        sectorName: request.table.sector.name,
      }));

      const qrPDFContent = await QRGenerator.generateQRPDFContent(qrData);

      return {
        success: true,
        data: {
          qrPDFContent,
          fileName: `QR-${request.event.name}-${request.client.name}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Error al generar códigos QR",
        code: "GENERATION_ERROR",
      };
    }
  }

  async getAvailableTablesForEvent(eventId: string): Promise<
    ActionResult<
      Array<{
        id: string;
        name: string;
        sectorId: string;
        sectorName: string;
      }>
    >
  > {
    try {
      const tables = await this.repository.getAvailableTablesForEvent(eventId);

      return {
        success: true,
        data: tables,
      };
    } catch (error) {
      return {
        success: false,
        error: "Error al obtener mesas disponibles",
        code: "FETCH_ERROR",
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

export async function getRequests(
  filters?: RequestFilters,
  pagination?: PaginationParams
) {
  return requestService.getRequests(filters, pagination);
}

export async function downloadRequestQRs(requestId: string) {
  return requestService.downloadRequestQRs(requestId);
}

export async function getAvailableTablesForEvent(eventId: string) {
  return requestService.getAvailableTablesForEvent(eventId);
}
