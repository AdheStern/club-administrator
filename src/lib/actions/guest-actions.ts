// src/lib/actions/guest-actions.ts

"use server";

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
  CreateGuestDTO,
  GuestFilters,
  GuestFromPrisma,
  GuestSortParams,
  GuestWithStats,
  UpdateGuestDTO,
} from "./types/guest-types";

interface GuestSearchResult {
  id: string;
  name: string;
  identityCard: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
}

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

interface IdentityCardValidationStrategy {
  validate(
    identityCard: string,
    excludeId?: string,
  ): Promise<ActionResult<void>>;
}

class UniqueIdentityCardStrategy implements IdentityCardValidationStrategy {
  async validate(
    identityCard: string,
    excludeId?: string,
  ): Promise<ActionResult<void>> {
    const existing = await db.guest.findUnique({
      where: { identityCard },
      select: { id: true },
    });

    if (existing && existing.id !== excludeId) {
      return {
        success: false,
        error: `Ya existe un cliente con el CI "${identityCard}"`,
        code: "DUPLICATE_IDENTITY_CARD",
      };
    }

    return { success: true };
  }
}

class GuestRepository {
  private readonly include = {
    _count: {
      select: {
        requestsAsClient: true,
        qrEntries: true,
      },
    },
  };

  async findMany(
    filters: GuestFilters,
    pagination: PaginationParams,
    sort?: GuestSortParams,
  ): Promise<{ data: GuestFromPrisma[]; total: number }> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(sort);

    const [data, total] = await Promise.all([
      db.guest.findMany({
        where,
        include: this.include,
        orderBy,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      db.guest.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<GuestFromPrisma | null> {
    return db.guest.findUnique({
      where: { id },
      include: this.include,
    });
  }

  async create(dto: CreateGuestDTO): Promise<GuestFromPrisma> {
    return db.guest.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name.trim(),
        identityCard: dto.identityCard.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        instagramHandle: dto.instagramHandle?.trim() || null,
      },
      include: this.include,
    });
  }

  async update(dto: UpdateGuestDTO): Promise<GuestFromPrisma> {
    return db.guest.update({
      where: { id: dto.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.identityCard !== undefined && {
          identityCard: dto.identityCard.trim(),
        }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.email !== undefined && {
          email: dto.email?.trim().toLowerCase() || null,
        }),
        ...(dto.instagramHandle !== undefined && {
          instagramHandle: dto.instagramHandle?.trim() || null,
        }),
      },
      include: this.include,
    });
  }

  async delete(id: string): Promise<void> {
    await db.guest.delete({ where: { id } });
  }

  async hasRequests(id: string): Promise<boolean> {
    const count = await db.request.count({ where: { clientId: id } });
    return count > 0;
  }

  private buildWhereClause(filters: GuestFilters) {
    if (!filters.search?.trim()) return {};

    const term = filters.search.trim();
    return {
      OR: [
        { name: { contains: term, mode: "insensitive" as const } },
        { identityCard: { contains: term, mode: "insensitive" as const } },
        { phone: { contains: term, mode: "insensitive" as const } },
        { email: { contains: term, mode: "insensitive" as const } },
        { instagramHandle: { contains: term, mode: "insensitive" as const } },
      ],
    };
  }

  private buildOrderBy(sort?: GuestSortParams) {
    if (!sort) return { createdAt: "desc" as const };
    return { [sort.field]: sort.direction };
  }
}

class GuestSearchService {
  async searchGuests(
    query: string,
  ): Promise<ActionResult<GuestSearchResult[]>> {
    try {
      if (query.length < 2) {
        return { success: true, data: [] };
      }

      const guests = await db.guest.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { identityCard: { contains: query, mode: "insensitive" } },
          ],
          NOT: { identityCard: { startsWith: "TEMP-" } },
        },
        select: {
          id: true,
          name: true,
          identityCard: true,
          phone: true,
          email: true,
          instagramHandle: true,
        },
        take: 10,
        orderBy: [{ eventsAttended: "desc" }, { name: "asc" }],
      });

      return { success: true, data: guests };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al buscar invitados",
        code: "SEARCH_ERROR",
      };
    }
  }
}

const guestRepository = new GuestRepository();
const identityCardValidator = new UniqueIdentityCardStrategy();
const guestSearchService = new GuestSearchService();

async function assertAllowedRole(): Promise<ActionResult<void>> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "No autenticado", code: "UNAUTHORIZED" };
  }

  if (
    !ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])
  ) {
    return {
      success: false,
      error: "Sin permisos suficientes",
      code: "FORBIDDEN",
    };
  }

  return { success: true };
}

function mapToDTO(guest: GuestFromPrisma): GuestWithStats {
  return {
    id: guest.id,
    name: guest.name,
    identityCard: guest.identityCard,
    phone: guest.phone,
    email: guest.email,
    instagramHandle: guest.instagramHandle,
    loyaltyPoints: guest.loyaltyPoints,
    eventsAttended: guest.eventsAttended,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    _count: guest._count,
  };
}

export async function searchGuests(query: string) {
  return guestSearchService.searchGuests(query);
}

export async function getGuests(
  filters: GuestFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 50 },
  sort?: GuestSortParams,
): Promise<ActionResult<PaginatedResult<GuestWithStats>>> {
  try {
    const authCheck = await assertAllowedRole();
    if (!authCheck.success)
      return authCheck as ActionResult<PaginatedResult<GuestWithStats>>;

    const { data, total } = await guestRepository.findMany(
      filters,
      pagination,
      sort,
    );

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
      error:
        error instanceof Error ? error.message : "Error al obtener clientes",
      code: "FETCH_ERROR",
    };
  }
}

export async function getGuestById(
  id: string,
): Promise<ActionResult<GuestWithStats>> {
  try {
    const authCheck = await assertAllowedRole();
    if (!authCheck.success) return authCheck as ActionResult<GuestWithStats>;

    const guest = await guestRepository.findById(id);
    if (!guest) {
      return {
        success: false,
        error: "Cliente no encontrado",
        code: "NOT_FOUND",
      };
    }

    return { success: true, data: mapToDTO(guest) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener cliente",
      code: "FETCH_ERROR",
    };
  }
}

export async function createGuest(
  dto: CreateGuestDTO,
): Promise<ActionResult<GuestWithStats>> {
  try {
    const authCheck = await assertAllowedRole();
    if (!authCheck.success) return authCheck as ActionResult<GuestWithStats>;

    const validation = await identityCardValidator.validate(dto.identityCard);
    if (!validation.success) return validation as ActionResult<GuestWithStats>;

    const guest = await guestRepository.create(dto);
    revalidatePath("/guests");

    return { success: true, data: mapToDTO(guest) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear cliente",
      code: "CREATE_ERROR",
    };
  }
}

export async function updateGuest(
  dto: UpdateGuestDTO,
): Promise<ActionResult<GuestWithStats>> {
  try {
    const authCheck = await assertAllowedRole();
    if (!authCheck.success) return authCheck as ActionResult<GuestWithStats>;

    const existing = await guestRepository.findById(dto.id);
    if (!existing) {
      return {
        success: false,
        error: "Cliente no encontrado",
        code: "NOT_FOUND",
      };
    }

    if (dto.identityCard && dto.identityCard !== existing.identityCard) {
      const validation = await identityCardValidator.validate(
        dto.identityCard,
        dto.id,
      );
      if (!validation.success)
        return validation as ActionResult<GuestWithStats>;
    }

    const guest = await guestRepository.update(dto);
    revalidatePath("/guests");

    return { success: true, data: mapToDTO(guest) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar cliente",
      code: "UPDATE_ERROR",
    };
  }
}

export async function deleteGuest(id: string): Promise<ActionResult<void>> {
  try {
    const authCheck = await assertAllowedRole();
    if (!authCheck.success) return authCheck;

    const existing = await guestRepository.findById(id);
    if (!existing) {
      return {
        success: false,
        error: "Cliente no encontrado",
        code: "NOT_FOUND",
      };
    }

    const hasRequests = await guestRepository.hasRequests(id);
    if (hasRequests) {
      return {
        success: false,
        error: "No se puede eliminar un cliente con reservas asociadas",
        code: "HAS_DEPENDENCIES",
      };
    }

    await guestRepository.delete(id);
    revalidatePath("/guests");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar cliente",
      code: "DELETE_ERROR",
    };
  }
}
