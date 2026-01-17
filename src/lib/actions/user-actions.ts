"use server";

import { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  ActionResult,
  CreateUserDTO,
  PaginatedResult,
  PaginationParams,
  UpdateUserDTO,
  UserFilters,
  UserWithRelations,
} from "./types/action-types";

const UserFactory = {
  prepareUserData(dto: CreateUserDTO) {
    return {
      role: dto.role ?? UserRole.USER,
      status: dto.status ?? UserStatus.ACTIVE,
      departmentId: dto.departmentId ?? null,
      managerId: dto.managerId ?? null,
      image: dto.image ?? null,
    };
  },
};

interface ValidationStrategy {
  validate(data: unknown): Promise<ActionResult<void>>;
}

class EmailValidationStrategy implements ValidationStrategy {
  async validate(email: string): Promise<ActionResult<void>> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Email inválido",
        code: "INVALID_EMAIL",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: "El email ya está registrado",
        code: "EMAIL_EXISTS",
      };
    }

    return { success: true };
  }
}

class HierarchyValidationStrategy implements ValidationStrategy {
  async validate(data: {
    userId: string;
    managerId?: string;
  }): Promise<ActionResult<void>> {
    if (!data.managerId) {
      return { success: true };
    }

    if (data.userId === data.managerId) {
      return {
        success: false,
        error: "Un usuario no puede ser su propio manager",
        code: "CIRCULAR_REFERENCE",
      };
    }

    const hasCircularReference = await this.checkCircularReference(
      data.userId,
      data.managerId,
    );

    if (hasCircularReference) {
      return {
        success: false,
        error: "Se detectó una referencia circular en la jerarquía",
        code: "CIRCULAR_HIERARCHY",
      };
    }

    return { success: true };
  }

  private async checkCircularReference(
    userId: string,
    managerId: string,
  ): Promise<boolean> {
    let currentManagerId: string | null = managerId;
    const visitedIds = new Set<string>([userId]);

    while (currentManagerId) {
      if (visitedIds.has(currentManagerId)) {
        return true;
      }

      visitedIds.add(currentManagerId);

      const manager = await db.user.findUnique({
        where: { id: currentManagerId },
        select: { managerId: true },
      });

      if (!manager) break;

      currentManagerId = manager.managerId;
    }

    return false;
  }
}

class UserRepository {
  async create(userData: CreateUserDTO) {
    const preparedData = UserFactory.prepareUserData(userData);

    if (!userData.password) {
      throw new Error("La contraseña es requerida");
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name,
      },
    });

    if (!result || !result.user) {
      throw new Error("Error al crear usuario con Better Auth");
    }

    const updatedUser = await db.user.update({
      where: { id: result.user.id },
      data: {
        role: preparedData.role,
        status: preparedData.status,
        departmentId: preparedData.departmentId,
        managerId: preparedData.managerId,
        image: preparedData.image,
        emailVerified: true,
        updatedAt: new Date(),
      },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true } },
      },
    });

    return updatedUser;
  }

  async update(id: string, data: Partial<UpdateUserDTO>) {
    return db.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true } },
      },
    });
  }

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true } },
      },
    });
  }

  async findMany(
    filters: UserFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<UserWithRelations>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(filters.role && { role: filters.role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.managerId && { managerId: filters.managerId }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
          subordinates: { select: { id: true, name: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      data: data as UserWithRelations[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(id: string) {
    await db.account.deleteMany({
      where: { userId: id },
    });

    return db.user.delete({ where: { id } });
  }

  async updateStatus(id: string, status: UserStatus) {
    return this.update(id, { status });
  }
}

abstract class ValidationHandler {
  protected next: ValidationHandler | null = null;

  setNext(handler: ValidationHandler): ValidationHandler {
    this.next = handler;
    return handler;
  }

  async handle(data: unknown): Promise<ActionResult<void>> {
    const result = await this.validate(data);

    if (!result.success) {
      return result;
    }

    if (this.next) {
      return this.next.handle(data);
    }

    return { success: true };
  }

  protected abstract validate(data: unknown): Promise<ActionResult<void>>;
}

class RequiredFieldsHandler extends ValidationHandler {
  protected async validate(data: CreateUserDTO): Promise<ActionResult<void>> {
    if (!data.name || data.name.trim().length === 0) {
      return {
        success: false,
        error: "El nombre es requerido",
        code: "REQUIRED_NAME",
      };
    }

    if (!data.email || data.email.trim().length === 0) {
      return {
        success: false,
        error: "El email es requerido",
        code: "REQUIRED_EMAIL",
      };
    }

    return { success: true };
  }
}

class EmailValidationHandler extends ValidationHandler {
  private strategy = new EmailValidationStrategy();

  protected async validate(data: CreateUserDTO): Promise<ActionResult<void>> {
    return this.strategy.validate(data.email);
  }
}

class HierarchyValidationHandler extends ValidationHandler {
  private strategy = new HierarchyValidationStrategy();

  protected async validate(data: UpdateUserDTO): Promise<ActionResult<void>> {
    return this.strategy.validate({
      userId: data.id,
      managerId: data.managerId,
    });
  }
}

class PasswordValidationHandler extends ValidationHandler {
  protected async validate(data: CreateUserDTO): Promise<ActionResult<void>> {
    if (!data.password) {
      return {
        success: false,
        error: "La contraseña es requerida",
        code: "REQUIRED_PASSWORD",
      };
    }

    if (data.password.length < 8) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
        code: "PASSWORD_TOO_SHORT",
      };
    }

    const hasUpperCase = /[A-Z]/.test(data.password);
    const hasLowerCase = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return {
        success: false,
        error: "La contraseña debe contener mayúsculas, minúsculas y números",
        code: "PASSWORD_WEAK",
      };
    }

    return { success: true };
  }
}

class UserService {
  private repository = new UserRepository();

  async createUser(
    dto: CreateUserDTO,
  ): Promise<ActionResult<UserWithRelations>> {
    try {
      const validationChain = new RequiredFieldsHandler();
      validationChain
        .setNext(new EmailValidationHandler())
        .setNext(new PasswordValidationHandler());

      const validationResult = await validationChain.handle(dto);

      if (!validationResult.success) {
        return validationResult as ActionResult<UserWithRelations>;
      }

      const user = await this.repository.create(dto);

      revalidatePath("/administration/users");

      return {
        success: true,
        data: user as UserWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al crear usuario",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateUser(
    dto: UpdateUserDTO,
  ): Promise<ActionResult<UserWithRelations>> {
    try {
      const validationChain = new HierarchyValidationHandler();
      const validationResult = await validationChain.handle(dto);

      if (!validationResult.success) {
        return validationResult as ActionResult<UserWithRelations>;
      }

      const user = await this.repository.update(dto.id, dto);

      revalidatePath("/administration/users");

      return {
        success: true,
        data: user as UserWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getUserById(id: string): Promise<ActionResult<UserWithRelations>> {
    try {
      const user = await this.repository.findById(id);

      if (!user) {
        return {
          success: false,
          error: "Usuario no encontrado",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: user as UserWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener usuario",
        code: "FETCH_ERROR",
      };
    }
  }

  async getUsers(
    filters: UserFilters = {},
    pagination: PaginationParams = {},
  ): Promise<ActionResult<PaginatedResult<UserWithRelations>>> {
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
          error instanceof Error ? error.message : "Error al obtener usuarios",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteUser(id: string): Promise<ActionResult> {
    try {
      const user = await this.repository.findById(id);

      if (!user) {
        return {
          success: false,
          error: "Usuario no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (user.subordinates.length > 0) {
        return {
          success: false,
          error: "No se puede eliminar un usuario con subordinados",
          code: "HAS_SUBORDINATES",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/administration/users");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar usuario",
        code: "DELETE_ERROR",
      };
    }
  }

  async updateUserStatus(
    id: string,
    status: UserStatus,
  ): Promise<ActionResult> {
    try {
      await this.repository.updateStatus(id, status);

      revalidatePath("/administration/users");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar estado",
        code: "UPDATE_STATUS_ERROR",
      };
    }
  }
}

const userService = new UserService();

export async function createUser(dto: CreateUserDTO) {
  return userService.createUser(dto);
}

export async function updateUser(dto: UpdateUserDTO) {
  return userService.updateUser(dto);
}

export async function getUserById(id: string) {
  return userService.getUserById(id);
}

export async function getUsers(
  filters?: UserFilters,
  pagination?: PaginationParams,
) {
  return userService.getUsers(filters, pagination);
}

export async function deleteUser(id: string) {
  return userService.deleteUser(id);
}

export async function updateUserStatus(id: string, status: UserStatus) {
  return userService.updateUserStatus(id, status);
}
