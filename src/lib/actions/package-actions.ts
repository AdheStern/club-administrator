// src/lib/actions/package-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertDecimalsToNumbers } from "./helpers/decimal-converter";
import type {
  ActionResult,
  PaginatedResult,
  PaginationParams,
} from "./types/action-types";
import type {
  CreatePackageDTO,
  PackageFilters,
  PackageWithRelations,
  UpdatePackageDTO,
} from "./types/package-types";

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class PackageNameValidationStrategy implements ValidationStrategy {
  async validate(data: {
    name: string;
    excludeId?: string;
  }): Promise<ActionResult<void>> {
    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      return {
        success: false,
        error: "El nombre del paquete es requerido",
        code: "REQUIRED_NAME",
      };
    }

    if (trimmedName.length > 100) {
      return {
        success: false,
        error: "El nombre del paquete no puede exceder 100 caracteres",
        code: "NAME_TOO_LONG",
      };
    }

    const existingPackage = await db.package.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
        ...(data.excludeId && { id: { not: data.excludeId } }),
      },
    });

    if (existingPackage) {
      return {
        success: false,
        error: "Ya existe un paquete con este nombre",
        code: "NAME_EXISTS",
      };
    }

    return { success: true };
  }
}

class PeopleValidationStrategy implements ValidationStrategy {
  async validate(includedPeople: number): Promise<ActionResult<void>> {
    if (includedPeople < 1) {
      return {
        success: false,
        error: "El número de personas debe ser mayor a 0",
        code: "INVALID_PEOPLE_COUNT",
      };
    }

    if (includedPeople > 50) {
      return {
        success: false,
        error: "El número de personas no puede exceder 50",
        code: "PEOPLE_COUNT_TOO_HIGH",
      };
    }

    return { success: true };
  }
}

class PriceValidationStrategy implements ValidationStrategy {
  async validate(price: number): Promise<ActionResult<void>> {
    if (price < 0) {
      return {
        success: false,
        error: "El precio no puede ser negativo",
        code: "INVALID_PRICE",
      };
    }

    if (price > 999999.99) {
      return {
        success: false,
        error: "El precio no puede exceder 999,999.99",
        code: "PRICE_TOO_HIGH",
      };
    }

    return { success: true };
  }
}

class PackageRepository {
  async create(data: CreatePackageDTO): Promise<PackageWithRelations> {
    const result = await db.package.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        includedPeople: data.includedPeople,
        basePrice: data.basePrice,
        extraPersonPrice: data.extraPersonPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as PackageWithRelations;
  }

  async update(
    id: string,
    data: Partial<UpdatePackageDTO>
  ): Promise<PackageWithRelations> {
    const result = await db.package.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.includedPeople && { includedPeople: data.includedPeople }),
        ...(data.basePrice && { basePrice: data.basePrice }),
        ...(data.extraPersonPrice !== undefined && {
          extraPersonPrice: data.extraPersonPrice,
        }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as PackageWithRelations;
  }

  async findById(id: string): Promise<PackageWithRelations | null> {
    const result = await db.package.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!result) return null;
    return convertDecimalsToNumbers(result) as PackageWithRelations;
  }

  async findMany(
    filters: PackageFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<PackageWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where: {
      isActive?: boolean;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        {
          name: { contains: filters.search, mode: "insensitive" },
        },
        {
          description: { contains: filters.search, mode: "insensitive" },
        },
      ];
    }

    const [data, total] = await Promise.all([
      db.package.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      }),
      db.package.count({ where }),
    ]);

    const convertedData = data.map((item) =>
      convertDecimalsToNumbers(item)
    ) as PackageWithRelations[];

    return {
      data: convertedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(id: string): Promise<void> {
    await db.package.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string): Promise<PackageWithRelations> {
    const pkg = await db.package.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new Error("Paquete no encontrado");
    }

    const result = await db.package.update({
      where: { id },
      data: {
        isActive: !pkg.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    return convertDecimalsToNumbers(result) as PackageWithRelations;
  }
}

class PackageService {
  private repository = new PackageRepository();
  private nameValidation = new PackageNameValidationStrategy();
  private peopleValidation = new PeopleValidationStrategy();
  private priceValidation = new PriceValidationStrategy();

  async createPackage(
    dto: CreatePackageDTO
  ): Promise<ActionResult<PackageWithRelations>> {
    try {
      const nameValidation = await this.nameValidation.validate({
        name: dto.name,
      });

      if (!nameValidation.success) {
        return nameValidation;
      }

      const peopleValidation = await this.peopleValidation.validate(
        dto.includedPeople
      );

      if (!peopleValidation.success) {
        return peopleValidation;
      }

      const priceValidation = await this.priceValidation.validate(
        dto.basePrice
      );

      if (!priceValidation.success) {
        return priceValidation;
      }

      if (dto.extraPersonPrice !== undefined) {
        const extraPriceValidation = await this.priceValidation.validate(
          dto.extraPersonPrice
        );

        if (!extraPriceValidation.success) {
          return extraPriceValidation;
        }
      }

      const pkg = await this.repository.create(dto);

      revalidatePath("/dashboard/admin/packages");

      return {
        success: true,
        data: pkg,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al crear paquete",
        code: "CREATE_ERROR",
      };
    }
  }

  async updatePackage(
    dto: UpdatePackageDTO
  ): Promise<ActionResult<PackageWithRelations>> {
    try {
      const pkg = await this.repository.findById(dto.id);

      if (!pkg) {
        return {
          success: false,
          error: "Paquete no encontrado",
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

      if (dto.includedPeople) {
        const peopleValidation = await this.peopleValidation.validate(
          dto.includedPeople
        );

        if (!peopleValidation.success) {
          return peopleValidation;
        }
      }

      if (dto.basePrice !== undefined) {
        const priceValidation = await this.priceValidation.validate(
          dto.basePrice
        );

        if (!priceValidation.success) {
          return priceValidation;
        }
      }

      if (dto.extraPersonPrice !== undefined) {
        const extraPriceValidation = await this.priceValidation.validate(
          dto.extraPersonPrice
        );

        if (!extraPriceValidation.success) {
          return extraPriceValidation;
        }
      }

      const updatedPackage = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/packages");

      return {
        success: true,
        data: updatedPackage,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar paquete",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getPackageById(
    id: string
  ): Promise<ActionResult<PackageWithRelations>> {
    try {
      const pkg = await this.repository.findById(id);

      if (!pkg) {
        return {
          success: false,
          error: "Paquete no encontrado",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: pkg,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener paquete",
        code: "FETCH_ERROR",
      };
    }
  }

  async getPackages(
    filters: PackageFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ActionResult<PaginatedResult<PackageWithRelations>>> {
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
          error instanceof Error ? error.message : "Error al obtener paquetes",
        code: "FETCH_ERROR",
      };
    }
  }

  async deletePackage(id: string): Promise<ActionResult> {
    try {
      const pkg = await this.repository.findById(id);

      if (!pkg) {
        return {
          success: false,
          error: "Paquete no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (pkg._count.requests > 0) {
        return {
          success: false,
          error: "No se puede eliminar un paquete con solicitudes",
          code: "HAS_REQUESTS",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/packages");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar paquete",
        code: "DELETE_ERROR",
      };
    }
  }

  async togglePackageStatus(id: string): Promise<ActionResult> {
    try {
      await this.repository.toggleStatus(id);

      revalidatePath("/dashboard/admin/packages");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado del paquete",
        code: "TOGGLE_STATUS_ERROR",
      };
    }
  }
}

const packageService = new PackageService();

export async function createPackage(dto: CreatePackageDTO) {
  return packageService.createPackage(dto);
}

export async function updatePackage(dto: UpdatePackageDTO) {
  return packageService.updatePackage(dto);
}

export async function getPackageById(id: string) {
  return packageService.getPackageById(id);
}

export async function getPackages(
  filters?: PackageFilters,
  pagination?: PaginationParams
) {
  return packageService.getPackages(filters, pagination);
}

export async function deletePackage(id: string) {
  return packageService.deletePackage(id);
}

export async function togglePackageStatus(id: string) {
  return packageService.togglePackageStatus(id);
}
