// src/lib/actions/sector-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  CreateSectorDTO,
  SectorFilters,
  SectorWithRelations,
  UpdateSectorDTO,
} from "./types/sector-types";

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class SectorNameValidationStrategy implements ValidationStrategy {
  async validate(data: {
    name: string;
    excludeId?: string;
  }): Promise<ActionResult<void>> {
    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      return {
        success: false,
        error: "El nombre del sector es requerido",
        code: "REQUIRED_NAME",
      };
    }

    if (trimmedName.length > 100) {
      return {
        success: false,
        error: "El nombre del sector no puede exceder 100 caracteres",
        code: "NAME_TOO_LONG",
      };
    }

    const existingSector = await db.sector.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
        ...(data.excludeId && { id: { not: data.excludeId } }),
      },
    });

    if (existingSector) {
      return {
        success: false,
        error: "Ya existe un sector con este nombre",
        code: "NAME_EXISTS",
      };
    }

    return { success: true };
  }
}

class CapacityValidationStrategy implements ValidationStrategy {
  async validate(capacity: number): Promise<ActionResult<void>> {
    if (capacity < 1) {
      return {
        success: false,
        error: "La capacidad debe ser mayor a 0",
        code: "INVALID_CAPACITY",
      };
    }

    if (capacity > 10000) {
      return {
        success: false,
        error: "La capacidad no puede exceder 10000",
        code: "CAPACITY_TOO_HIGH",
      };
    }

    return { success: true };
  }
}

class SectorRepository {
  async create(data: CreateSectorDTO): Promise<SectorWithRelations> {
    return db.sector.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        description: data.description?.trim(),
        capacity: data.capacity,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            tables: true,
            eventSectors: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Partial<UpdateSectorDTO>
  ): Promise<SectorWithRelations> {
    return db.sector.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim(),
        }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            tables: true,
            eventSectors: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<SectorWithRelations | null> {
    return db.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tables: true,
            eventSectors: true,
          },
        },
      },
    });
  }

  async findMany(
    filters: SectorFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<SectorWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          {
            description: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      db.sector.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              tables: true,
              eventSectors: true,
            },
          },
        },
      }),
      db.sector.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(id: string): Promise<void> {
    await db.sector.delete({ where: { id } });
  }

  async toggleStatus(id: string): Promise<SectorWithRelations> {
    const sector = await this.findById(id);

    if (!sector) {
      throw new Error("Sector no encontrado");
    }

    return this.update(id, { isActive: !sector.isActive });
  }
}

class SectorService {
  private repository = new SectorRepository();
  private nameValidation = new SectorNameValidationStrategy();
  private capacityValidation = new CapacityValidationStrategy();

  async createSector(
    dto: CreateSectorDTO
  ): Promise<ActionResult<SectorWithRelations>> {
    try {
      const nameValidation = await this.nameValidation.validate({
        name: dto.name,
      });

      if (!nameValidation.success) {
        return nameValidation;
      }

      const capacityValidation = await this.capacityValidation.validate(
        dto.capacity
      );

      if (!capacityValidation.success) {
        return capacityValidation;
      }

      const sector = await this.repository.create(dto);

      revalidatePath("/dashboard/admin/sectors");

      return {
        success: true,
        data: sector,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear sector",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateSector(
    dto: UpdateSectorDTO
  ): Promise<ActionResult<SectorWithRelations>> {
    try {
      const sector = await this.repository.findById(dto.id);

      if (!sector) {
        return {
          success: false,
          error: "Sector no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (dto.name) {
        const nameValidation = await this.nameValidation.validate({
          name: dto.name,
          excludeId: dto.id,
        });

        if (!nameValidation.success) {
          return nameValidation;
        }
      }

      if (dto.capacity) {
        const capacityValidation = await this.capacityValidation.validate(
          dto.capacity
        );

        if (!capacityValidation.success) {
          return capacityValidation;
        }
      }

      const updatedSector = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/sectors");

      return {
        success: true,
        data: updatedSector,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar sector",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getSectorById(id: string): Promise<ActionResult<SectorWithRelations>> {
    try {
      const sector = await this.repository.findById(id);

      if (!sector) {
        return {
          success: false,
          error: "Sector no encontrado",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: sector,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener sector",
        code: "FETCH_ERROR",
      };
    }
  }

  async getSectors(
    filters: SectorFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ActionResult<PaginatedResult<SectorWithRelations>>> {
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
          error instanceof Error ? error.message : "Error al obtener sectores",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteSector(id: string): Promise<ActionResult> {
    try {
      const sector = await this.repository.findById(id);

      if (!sector) {
        return {
          success: false,
          error: "Sector no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (sector._count.tables > 0) {
        return {
          success: false,
          error: "No se puede eliminar un sector con mesas asignadas",
          code: "HAS_TABLES",
        };
      }

      if (sector._count.eventSectors > 0) {
        return {
          success: false,
          error: "No se puede eliminar un sector asignado a eventos",
          code: "HAS_EVENTS",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/sectors");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar sector",
        code: "DELETE_ERROR",
      };
    }
  }

  async toggleSectorStatus(id: string): Promise<ActionResult> {
    try {
      await this.repository.toggleStatus(id);

      revalidatePath("/dashboard/admin/sectors");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado del sector",
        code: "TOGGLE_STATUS_ERROR",
      };
    }
  }
}

const sectorService = new SectorService();

export async function createSector(dto: CreateSectorDTO) {
  return sectorService.createSector(dto);
}

export async function updateSector(dto: UpdateSectorDTO) {
  return sectorService.updateSector(dto);
}

export async function getSectorById(id: string) {
  return sectorService.getSectorById(id);
}

export async function getSectors(
  filters?: SectorFilters,
  pagination?: PaginationParams
) {
  return sectorService.getSectors(filters, pagination);
}

export async function deleteSector(id: string) {
  return sectorService.deleteSector(id);
}

export async function toggleSectorStatus(id: string) {
  return sectorService.toggleSectorStatus(id);
}
