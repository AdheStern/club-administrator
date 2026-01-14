// src/lib/actions/department-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ActionResult,
  CreateDepartmentDTO,
  DepartmentDetail,
  DepartmentWithRelations,
  UpdateDepartmentDTO,
} from "./types/action-types";

/**
 * Composite Pattern: Maneja estructura jerárquica de departamentos
 */
interface DepartmentNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: DepartmentNode[];
  userCount: number;
}

class DepartmentRepository {
  async create(data: CreateDepartmentDTO) {
    return db.department.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async update(id: string, data: Partial<UpdateDepartmentDTO>) {
    return db.department.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async findById(id: string) {
    return db.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: { select: { users: true } },
      },
    });
  }

  async findAll() {
    return db.department.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async delete(id: string) {
    return db.department.delete({ where: { id } });
  }

  async getHierarchy(): Promise<DepartmentNode[]> {
    const departments = await db.department.findMany({
      include: {
        _count: { select: { users: true } },
      },
    });

    const departmentMap = new Map<string, DepartmentNode>();

    for (const dept of departments) {
      departmentMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        description: dept.description,
        parentId: dept.parentId,
        children: [],
        userCount: dept._count.users,
      });
    }

    const rootDepartments: DepartmentNode[] = [];

    for (const dept of departments) {
      const node = departmentMap.get(dept.id);
      if (!node) continue;

      if (dept.parentId) {
        const parentNode = departmentMap.get(dept.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        rootDepartments.push(node);
      }
    }

    return rootDepartments;
  }
}

/**
 * Validación de ciclos en jerarquía
 */
class DepartmentHierarchyValidator {
  async validate(departmentId: string, parentId: string): Promise<boolean> {
    let currentParentId: string | null = parentId;
    const visitedIds = new Set<string>([departmentId]);

    while (currentParentId) {
      if (visitedIds.has(currentParentId)) {
        return false;
      }

      visitedIds.add(currentParentId);

      const parentDept = await db.department.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = parentDept?.parentId ?? null;
    }

    return true;
  }
}

class DepartmentService {
  private repository = new DepartmentRepository();
  private validator = new DepartmentHierarchyValidator();

  async createDepartment(
    dto: CreateDepartmentDTO
  ): Promise<ActionResult<DepartmentWithRelations>> {
    try {
      if (!dto.name || dto.name.trim().length === 0) {
        return {
          success: false,
          error: "El nombre del departamento es requerido",
          code: "REQUIRED_NAME",
        };
      }

      if (dto.parentId) {
        const parentDept = await this.repository.findById(dto.parentId);
        if (!parentDept) {
          return {
            success: false,
            error: "El departamento padre no existe",
            code: "PARENT_NOT_FOUND",
          };
        }
      }

      const department = await this.repository.create(dto);

      revalidatePath("/dashboard/admin/departments");

      return {
        success: true,
        data: department as DepartmentWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear departamento",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateDepartment(
    dto: UpdateDepartmentDTO
  ): Promise<ActionResult<DepartmentWithRelations>> {
    try {
      if (dto.parentId) {
        const isValid = await this.validator.validate(dto.id, dto.parentId);

        if (!isValid) {
          return {
            success: false,
            error: "Se detectó una referencia circular en la jerarquía",
            code: "CIRCULAR_HIERARCHY",
          };
        }
      }

      const department = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/departments");

      return {
        success: true,
        data: department as DepartmentWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar departamento",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getDepartmentById(id: string): Promise<ActionResult<DepartmentDetail>> {
    try {
      const department = await this.repository.findById(id);

      if (!department) {
        return {
          success: false,
          error: "Departamento no encontrado",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: department as DepartmentDetail,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener departamento",
        code: "FETCH_ERROR",
      };
    }
  }

  async getAllDepartments(): Promise<ActionResult<DepartmentWithRelations[]>> {
    try {
      const departments = await this.repository.findAll();

      return {
        success: true,
        data: departments as DepartmentWithRelations[],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener departamentos",
        code: "FETCH_ERROR",
      };
    }
  }

  async getDepartmentHierarchy(): Promise<ActionResult<DepartmentNode[]>> {
    try {
      const hierarchy = await this.repository.getHierarchy();

      return {
        success: true,
        data: hierarchy,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener jerarquía",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteDepartment(id: string): Promise<ActionResult> {
    try {
      const department = await this.repository.findById(id);

      if (!department) {
        return {
          success: false,
          error: "Departamento no encontrado",
          code: "NOT_FOUND",
        };
      }

      if (department._count.users > 0) {
        return {
          success: false,
          error: "No se puede eliminar un departamento con usuarios asignados",
          code: "HAS_USERS",
        };
      }

      if (department.children.length > 0) {
        return {
          success: false,
          error: "No se puede eliminar un departamento con subdepartamentos",
          code: "HAS_CHILDREN",
        };
      }

      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/departments");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar departamento",
        code: "DELETE_ERROR",
      };
    }
  }
}

const departmentService = new DepartmentService();

export async function createDepartment(dto: CreateDepartmentDTO) {
  return departmentService.createDepartment(dto);
}

export async function updateDepartment(dto: UpdateDepartmentDTO) {
  return departmentService.updateDepartment(dto);
}

export async function getDepartmentById(id: string) {
  return departmentService.getDepartmentById(id);
}

export async function getAllDepartments() {
  return departmentService.getAllDepartments();
}

export async function getDepartmentHierarchy() {
  return departmentService.getDepartmentHierarchy();
}

export async function deleteDepartment(id: string) {
  return departmentService.deleteDepartment(id);
}
