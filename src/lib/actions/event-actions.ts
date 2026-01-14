// src/lib/actions/event-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  CreateEventDTO,
  EventFilters,
  EventWithRelations,
  UpdateEventDTO,
} from "./types/event-types";

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class EventNameValidationStrategy implements ValidationStrategy {
  async validate(data: {
    name: string;
    excludeId?: string;
  }): Promise<ActionResult<void>> {
    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      return {
        success: false,
        error: "El nombre del evento es requerido",
        code: "REQUIRED_NAME",
      };
    }

    if (trimmedName.length > 200) {
      return {
        success: false,
        error: "El nombre del evento no puede exceder 200 caracteres",
        code: "NAME_TOO_LONG",
      };
    }

    return { success: true };
  }
}

class EventDateValidationStrategy implements ValidationStrategy {
  async validate(data: {
    eventDate: Date;
    visibilityStart: Date;
    visibilityEnd: Date;
  }): Promise<ActionResult<void>> {
    const now = new Date();

    if (data.eventDate < now) {
      return {
        success: false,
        error: "La fecha del evento no puede ser en el pasado",
        code: "INVALID_EVENT_DATE",
      };
    }

    if (data.visibilityStart >= data.visibilityEnd) {
      return {
        success: false,
        error:
          "La fecha de inicio de visibilidad debe ser anterior a la fecha de fin",
        code: "INVALID_VISIBILITY_RANGE",
      };
    }

    if (data.visibilityEnd > data.eventDate) {
      return {
        success: false,
        error:
          "La fecha de fin de visibilidad no puede ser posterior a la fecha del evento",
        code: "VISIBILITY_AFTER_EVENT",
      };
    }

    return { success: true };
  }
}

class EventSectorsValidationStrategy implements ValidationStrategy {
  async validate(sectorIds: string[]): Promise<ActionResult<void>> {
    if (sectorIds.length === 0) {
      return {
        success: false,
        error: "Debe seleccionar al menos un sector",
        code: "NO_SECTORS_SELECTED",
      };
    }

    const sectors = await db.sector.findMany({
      where: {
        id: { in: sectorIds },
        isActive: true,
      },
    });

    if (sectors.length !== sectorIds.length) {
      return {
        success: false,
        error: "Algunos sectores seleccionados no existen o están inactivos",
        code: "INVALID_SECTORS",
      };
    }

    return { success: true };
  }
}

class EventTablesValidationStrategy implements ValidationStrategy {
  async validate(data: {
    tableIds: string[];
    sectorIds: string[];
  }): Promise<ActionResult<void>> {
    if (data.tableIds.length === 0) {
      return {
        success: false,
        error: "Debe seleccionar al menos una mesa",
        code: "NO_TABLES_SELECTED",
      };
    }

    const tables = await db.table.findMany({
      where: {
        id: { in: data.tableIds },
        isActive: true,
      },
      select: {
        id: true,
        sectorId: true,
      },
    });

    if (tables.length !== data.tableIds.length) {
      return {
        success: false,
        error: "Algunas mesas seleccionadas no existen o están inactivas",
        code: "INVALID_TABLES",
      };
    }

    const invalidTables = tables.filter(
      (table) => !data.sectorIds.includes(table.sectorId)
    );

    if (invalidTables.length > 0) {
      return {
        success: false,
        error: "Algunas mesas no pertenecen a los sectores seleccionados",
        code: "TABLES_NOT_IN_SECTORS",
      };
    }

    return { success: true };
  }
}

class EventRepository {
  async create(data: CreateEventDTO): Promise<EventWithRelations> {
    return db.event.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        description: data.description?.trim(),
        eventDate: data.eventDate,
        visibilityStart: data.visibilityStart,
        visibilityEnd: data.visibilityEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventSectors: {
          create: data.sectorIds.map((sectorId) => ({
            id: crypto.randomUUID(),
            sectorId,
            createdAt: new Date(),
          })),
        },
        eventTables: {
          create: data.tableIds.map((tableId) => ({
            id: crypto.randomUUID(),
            tableId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        eventSectors: {
          include: {
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        eventTables: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
                sectorId: true,
                sector: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            requests: true,
            eventSectors: true,
            eventTables: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Partial<UpdateEventDTO>
  ): Promise<EventWithRelations> {
    const updateData: any = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && {
        description: data.description?.trim(),
      }),
      ...(data.eventDate && { eventDate: data.eventDate }),
      ...(data.visibilityStart && { visibilityStart: data.visibilityStart }),
      ...(data.visibilityEnd && { visibilityEnd: data.visibilityEnd }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    };

    if (data.sectorIds) {
      await db.eventSector.deleteMany({
        where: { eventId: id },
      });

      updateData.eventSectors = {
        create: data.sectorIds.map((sectorId) => ({
          id: crypto.randomUUID(),
          sectorId,
          createdAt: new Date(),
        })),
      };
    }

    if (data.tableIds) {
      await db.eventTable.deleteMany({
        where: { eventId: id },
      });

      updateData.eventTables = {
        create: data.tableIds.map((tableId) => ({
          id: crypto.randomUUID(),
          tableId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };
    }

    return db.event.update({
      where: { id },
      data: updateData,
      include: {
        eventSectors: {
          include: {
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        eventTables: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
                sectorId: true,
                sector: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            requests: true,
            eventSectors: true,
            eventTables: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<EventWithRelations | null> {
    return db.event.findUnique({
      where: { id },
      include: {
        eventSectors: {
          include: {
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        eventTables: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
                sectorId: true,
                sector: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            requests: true,
            eventSectors: true,
            eventTables: true,
          },
        },
      },
    });
  }

  async findMany(
    filters: EventFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<EventWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "eventDate",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where: any = {
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

    if (filters.dateFrom || filters.dateTo) {
      where.eventDate = {};
      if (filters.dateFrom) {
        where.eventDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.eventDate.lte = filters.dateTo;
      }
    }

    const [data, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          eventSectors: {
            include: {
              sector: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          eventTables: {
            include: {
              table: {
                select: {
                  id: true,
                  name: true,
                  sectorId: true,
                  sector: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              requests: true,
              eventSectors: true,
              eventTables: true,
            },
          },
        },
      }),
      db.event.count({ where }),
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
    await db.event.delete({ where: { id } });
  }

  async toggleStatus(id: string): Promise<EventWithRelations> {
    const event = await this.findById(id);

    if (!event) {
      throw new Error("Evento no encontrado");
    }

    return this.update(id, { isActive: !event.isActive });
  }
}

class EventService {
  private repository = new EventRepository();
  private nameValidation = new EventNameValidationStrategy();
  private dateValidation = new EventDateValidationStrategy();
  private sectorsValidation = new EventSectorsValidationStrategy();
  private tablesValidation = new EventTablesValidationStrategy();

  async createEvent(
    dto: CreateEventDTO
  ): Promise<ActionResult<EventWithRelations>> {
    try {
      const nameValidation = await this.nameValidation.validate({
        name: dto.name,
      });

      if (!nameValidation.success) {
        return nameValidation;
      }

      const dateValidation = await this.dateValidation.validate({
        eventDate: dto.eventDate,
        visibilityStart: dto.visibilityStart,
        visibilityEnd: dto.visibilityEnd,
      });

      if (!dateValidation.success) {
        return dateValidation;
      }

      const sectorsValidation = await this.sectorsValidation.validate(
        dto.sectorIds
      );

      if (!sectorsValidation.success) {
        return sectorsValidation;
      }

      const tablesValidation = await this.tablesValidation.validate({
        tableIds: dto.tableIds,
        sectorIds: dto.sectorIds,
      });

      if (!tablesValidation.success) {
        return tablesValidation;
      }

      const event = await this.repository.create(dto);

      revalidatePath("/dashboard/admin/events");

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear evento",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateEvent(
    dto: UpdateEventDTO
  ): Promise<ActionResult<EventWithRelations>> {
    try {
      const event = await this.repository.findById(dto.id);

      if (!event) {
        return {
          success: false,
          error: "Evento no encontrado",
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

      if (dto.eventDate || dto.visibilityStart || dto.visibilityEnd) {
        const dateValidation = await this.dateValidation.validate({
          eventDate: dto.eventDate ?? event.eventDate,
          visibilityStart: dto.visibilityStart ?? event.visibilityStart,
          visibilityEnd: dto.visibilityEnd ?? event.visibilityEnd,
        });

        if (!dateValidation.success) {
          return dateValidation;
        }
      }

      if (dto.sectorIds) {
        const sectorsValidation = await this.sectorsValidation.validate(
          dto.sectorIds
        );

        if (!sectorsValidation.success) {
          return sectorsValidation;
        }
      }

      if (dto.tableIds && dto.sectorIds) {
        const tablesValidation = await this.tablesValidation.validate({
          tableIds: dto.tableIds,
          sectorIds: dto.sectorIds,
        });

        if (!tablesValidation.success) {
          return tablesValidation;
        }
      }

      const updatedEvent = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/events");

      return {
        success: true,
        data: updatedEvent,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar evento",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getEventById(id: string): Promise<ActionResult<EventWithRelations>> {
    try {
      const event = await this.repository.findById(id);

      if (!event) {
        return {
          success: false,
          error: "Evento no encontrado",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener evento",
        code: "FETCH_ERROR",
      };
    }
  }

  async getEvents(
    filters: EventFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ActionResult<PaginatedResult<EventWithRelations>>> {
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
          error instanceof Error ? error.message : "Error al obtener eventos",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteEvent(id: string): Promise<ActionResult> {
    try {
      const event = await this.repository.findById(id);

      if (!event) {
        return {
          success: false,
          error: "Evento no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (event._count.requests > 0) {
        return {
          success: false,
          error: "No se puede eliminar un evento con solicitudes",
          code: "HAS_REQUESTS",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/events");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar evento",
        code: "DELETE_ERROR",
      };
    }
  }

  async toggleEventStatus(id: string): Promise<ActionResult> {
    try {
      await this.repository.toggleStatus(id);

      revalidatePath("/dashboard/admin/events");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado del evento",
        code: "TOGGLE_STATUS_ERROR",
      };
    }
  }
}

const eventService = new EventService();

export async function createEvent(dto: CreateEventDTO) {
  return eventService.createEvent(dto);
}

export async function updateEvent(dto: UpdateEventDTO) {
  return eventService.updateEvent(dto);
}

export async function getEventById(id: string) {
  return eventService.getEventById(id);
}

export async function getEvents(
  filters?: EventFilters,
  pagination?: PaginationParams
) {
  return eventService.getEvents(filters, pagination);
}

export async function deleteEvent(id: string) {
  return eventService.deleteEvent(id);
}

export async function toggleEventStatus(id: string) {
  return eventService.toggleEventStatus(id);
}
