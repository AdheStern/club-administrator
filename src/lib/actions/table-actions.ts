// src/lib/actions/table-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  CreateTableDTO,
  TableFilters,
  TableWithRelations,
  UpdateTableDTO,
} from "./types/table-types";

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class TableNameValidationStrategy implements ValidationStrategy {
  async validate(data: {
    name: string;
    sectorId: string;
    excludeId?: string;
  }): Promise<ActionResult<void>> {
    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      return {
        success: false,
        error: "El nombre de la mesa es requerido",
        code: "REQUIRED_NAME",
      };
    }

    if (trimmedName.length > 100) {
      return {
        success: false,
        error: "El nombre de la mesa no puede exceder 100 caracteres",
        code: "NAME_TOO_LONG",
      };
    }

    const existingTable = await db.table.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
        sectorId: data.sectorId,
        ...(data.excludeId && { id: { not: data.excludeId } }),
      },
    });

    if (existingTable) {
      return {
        success: false,
        error: "Ya existe una mesa con este nombre en el sector",
        code: "NAME_EXISTS_IN_SECTOR",
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

    if (capacity > 100) {
      return {
        success: false,
        error: "La capacidad no puede exceder 100",
        code: "CAPACITY_TOO_HIGH",
      };
    }

    return { success: true };
  }
}

class SectorExistsValidationStrategy implements ValidationStrategy {
  async validate(sectorId: string): Promise<ActionResult<void>> {
    const sector = await db.sector.findUnique({
      where: { id: sectorId },
    });

    if (!sector) {
      return {
        success: false,
        error: "El sector seleccionado no existe",
        code: "SECTOR_NOT_FOUND",
      };
    }

    if (!sector.isActive) {
      return {
        success: false,
        error: "El sector seleccionado está inactivo",
        code: "SECTOR_INACTIVE",
      };
    }

    return { success: true };
  }
}

class TableRepository {
  async create(data: CreateTableDTO): Promise<TableWithRelations> {
    return db.table.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        sectorId: data.sectorId,
        capacity: data.capacity,
        tableType: data.tableType ?? "COMMON",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            eventTables: true,
            requests: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Partial<UpdateTableDTO>
  ): Promise<TableWithRelations> {
    return db.table.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.sectorId && { sectorId: data.sectorId }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.tableType && { tableType: data.tableType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            eventTables: true,
            requests: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<TableWithRelations | null> {
    return db.table.findUnique({
      where: { id },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            eventTables: true,
            requests: true,
          },
        },
      },
    });
  }

  async findMany(
    filters: TableFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TableWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(filters.sectorId && { sectorId: filters.sectorId }),
      ...(filters.tableType && { tableType: filters.tableType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          {
            sector: {
              name: { contains: filters.search, mode: "insensitive" as const },
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      db.table.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              eventTables: true,
              requests: true,
            },
          },
        },
      }),
      db.table.count({ where }),
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
    await db.table.delete({ where: { id } });
  }

  async toggleStatus(id: string): Promise<TableWithRelations> {
    const table = await this.findById(id);

    if (!table) {
      throw new Error("Mesa no encontrada");
    }

    return this.update(id, { isActive: !table.isActive });
  }
}

class TableService {
  private repository = new TableRepository();
  private nameValidation = new TableNameValidationStrategy();
  private capacityValidation = new CapacityValidationStrategy();
  private sectorValidation = new SectorExistsValidationStrategy();

  async createTable(
    dto: CreateTableDTO
  ): Promise<ActionResult<TableWithRelations>> {
    try {
      const sectorValidation = await this.sectorValidation.validate(
        dto.sectorId
      );

      if (!sectorValidation.success) {
        return sectorValidation;
      }

      const nameValidation = await this.nameValidation.validate({
        name: dto.name,
        sectorId: dto.sectorId,
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

      const table = await this.repository.create(dto);

      revalidatePath("/dashboard/admin/tables");

      return {
        success: true,
        data: table,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear mesa",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateTable(
    dto: UpdateTableDTO
  ): Promise<ActionResult<TableWithRelations>> {
    try {
      const table = await this.repository.findById(dto.id);

      if (!table) {
        return {
          success: false,
          error: "Mesa no encontrada",
          code: "NOT_FOUND",
        };
      }

      if (dto.sectorId) {
        const sectorValidation = await this.sectorValidation.validate(
          dto.sectorId
        );

        if (!sectorValidation.success) {
          return sectorValidation;
        }
      }

      if (dto.name || dto.sectorId) {
        const nameValidation = await this.nameValidation.validate({
          name: dto.name ?? table.name,
          sectorId: dto.sectorId ?? table.sectorId,
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

      const updatedTable = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/tables");

      return {
        success: true,
        data: updatedTable,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar mesa",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getTableById(id: string): Promise<ActionResult<TableWithRelations>> {
    try {
      const table = await this.repository.findById(id);

      if (!table) {
        return {
          success: false,
          error: "Mesa no encontrada",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: table,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener mesa",
        code: "FETCH_ERROR",
      };
    }
  }

  async getTables(
    filters: TableFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ActionResult<PaginatedResult<TableWithRelations>>> {
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
          error instanceof Error ? error.message : "Error al obtener mesas",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteTable(id: string): Promise<ActionResult> {
    try {
      const table = await this.repository.findById(id);

      if (!table) {
        return {
          success: false,
          error: "Mesa no encontrada",
          code: "NOT_FOUND",
        };
      }

      if (table._count.eventTables > 0) {
        return {
          success: false,
          error: "No se puede eliminar una mesa asignada a eventos",
          code: "HAS_EVENTS",
        };
      }

      if (table._count.requests > 0) {
        return {
          success: false,
          error: "No se puede eliminar una mesa con solicitudes",
          code: "HAS_REQUESTS",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/tables");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar mesa",
        code: "DELETE_ERROR",
      };
    }
  }

  async toggleTableStatus(id: string): Promise<ActionResult> {
    try {
      await this.repository.toggleStatus(id);

      revalidatePath("/dashboard/admin/tables");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado de la mesa",
        code: "TOGGLE_STATUS_ERROR",
      };
    }
  }
}

const tableService = new TableService();

export async function createTable(dto: CreateTableDTO) {
  return tableService.createTable(dto);
}

export async function updateTable(dto: UpdateTableDTO) {
  return tableService.updateTable(dto);
}

export async function getTableById(id: string) {
  return tableService.getTableById(id);
}

export async function getTables(
  filters?: TableFilters,
  pagination?: PaginationParams
) {
  return tableService.getTables(filters, pagination);
}

export async function deleteTable(id: string) {
  return tableService.deleteTable(id);
}

export async function toggleTableStatus(id: string) {
  return tableService.toggleTableStatus(id);
}
