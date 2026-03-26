// src/lib/actions/cover-actions.ts

"use server";

import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  CoverDTO,
  CoverFilters,
  CoverStats,
  CreateCoverDTO,
} from "./types/cover-types";

const ALLOWED_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SUPERVISOR",
  "USER",
] as const;

type CoverFromPrisma = {
  id: string;
  eventId: string;
  cashAmount: Decimal;
  qrAmount: Decimal;
  total: Decimal;
  createdById: string;
  createdAt: Date;
  createdBy: { name: string };
};

class CoverRepository {
  private readonly include = {
    createdBy: { select: { name: true } },
  };

  async create(
    dto: CreateCoverDTO,
    createdById: string,
  ): Promise<CoverFromPrisma> {
    const total = dto.cashAmount + dto.qrAmount;

    return db.cover.create({
      data: {
        id: crypto.randomUUID(),
        eventId: dto.eventId,
        cashAmount: new Decimal(dto.cashAmount),
        qrAmount: new Decimal(dto.qrAmount),
        total: new Decimal(total),
        createdById,
      },
      include: this.include,
    });
  }

  async findMany(
    filters: CoverFilters,
    pagination: PaginationParams,
  ): Promise<{ data: CoverFromPrisma[]; total: number }> {
    const where = filters.eventId ? { eventId: filters.eventId } : {};

    const [data, total] = await Promise.all([
      db.cover.findMany({
        where,
        include: this.include,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      db.cover.count({ where }),
    ]);

    return { data, total };
  }

  async getStats(eventId: string): Promise<CoverStats> {
    const result = await db.cover.aggregate({
      where: { eventId },
      _count: { id: true },
      _sum: { cashAmount: true, qrAmount: true, total: true },
    });

    return {
      totalCovers: result._count.id,
      totalCash: Number(result._sum.cashAmount ?? 0),
      totalQR: Number(result._sum.qrAmount ?? 0),
      grandTotal: Number(result._sum.total ?? 0),
    };
  }

  async delete(id: string): Promise<void> {
    await db.cover.delete({ where: { id } });
  }
}

const coverRepository = new CoverRepository();

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (
    !ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])
  )
    return null;
  return session;
}

function mapToDTO(cover: CoverFromPrisma): CoverDTO {
  return {
    id: cover.id,
    eventId: cover.eventId,
    cashAmount: Number(cover.cashAmount),
    qrAmount: Number(cover.qrAmount),
    total: Number(cover.total),
    createdById: cover.createdById,
    createdByName: cover.createdBy.name,
    createdAt: cover.createdAt.toISOString(),
  };
}

export async function createCover(
  dto: CreateCoverDTO,
): Promise<ActionResult<CoverDTO>> {
  try {
    const session = await getSession();
    if (!session)
      return { success: false, error: "No autenticado", code: "UNAUTHORIZED" };

    const event = await db.event.findUnique({
      where: { id: dto.eventId },
      select: { hasCover: true, isActive: true },
    });

    if (!event)
      return {
        success: false,
        error: "Evento no encontrado",
        code: "NOT_FOUND",
      };
    if (!event.hasCover)
      return {
        success: false,
        error: "Este evento no tiene cover habilitado",
        code: "COVER_DISABLED",
      };

    if (dto.cashAmount < 0 || dto.qrAmount < 0) {
      return {
        success: false,
        error: "Los montos no pueden ser negativos",
        code: "INVALID_AMOUNT",
      };
    }

    if (dto.cashAmount === 0 && dto.qrAmount === 0) {
      return {
        success: false,
        error: "Debe registrar al menos un monto",
        code: "ZERO_AMOUNT",
      };
    }

    const cover = await coverRepository.create(dto, session.user.id);
    revalidatePath("/covers");

    return { success: true, data: mapToDTO(cover) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al registrar cover",
      code: "CREATE_ERROR",
    };
  }
}

export async function getCovers(
  filters: CoverFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 1000 },
): Promise<ActionResult<PaginatedResult<CoverDTO>>> {
  try {
    const session = await getSession();
    if (!session)
      return {
        success: false,
        error: "No autenticado",
        code: "UNAUTHORIZED",
      } as ActionResult<PaginatedResult<CoverDTO>>;

    const { data, total } = await coverRepository.findMany(filters, pagination);

    return {
      success: true,
      data: {
        data: data.map(mapToDTO),
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener covers",
      code: "FETCH_ERROR",
    };
  }
}

export async function getCoverStats(
  eventId: string,
): Promise<ActionResult<CoverStats>> {
  try {
    const session = await getSession();
    if (!session)
      return { success: false, error: "No autenticado", code: "UNAUTHORIZED" };

    const stats = await coverRepository.getStats(eventId);
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener estadísticas",
      code: "FETCH_ERROR",
    };
  }
}

export async function deleteCover(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getSession();
    if (!session)
      return { success: false, error: "No autenticado", code: "UNAUTHORIZED" };

    const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
    if (!allowed.includes(session.user.role)) {
      return {
        success: false,
        error: "Sin permisos para eliminar",
        code: "FORBIDDEN",
      };
    }

    await coverRepository.delete(id);
    revalidatePath("/covers");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar cover",
      code: "DELETE_ERROR",
    };
  }
}
