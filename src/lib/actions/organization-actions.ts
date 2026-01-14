// src/lib/actions/organization-actions.ts

"use server";

import type { Prisma } from "@prisma/client";
import { InvitationStatus, OrgRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ActionResult,
  AddMemberDTO,
  CreateOrganizationDTO,
  InviteMemberDTO,
  OrganizationInvitation,
  OrganizationMemberWithUser,
  OrganizationWithRelations,
  UpdateOrganizationDTO,
} from "./types/action-types";

class OrganizationRepository {
  async create(data: CreateOrganizationDTO, ownerId: string) {
    return db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        metadata: data.metadata as Prisma.InputJsonValue,
        members: {
          create: {
            id: crypto.randomUUID(),
            userId: ownerId,
            role: OrgRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });
  }

  async update(id: string, data: Partial<UpdateOrganizationDTO>) {
    const updateData: Prisma.OrganizationUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    }
    updateData.updatedAt = new Date();

    return db.organization.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });
  }

  async findById(id: string) {
    return db.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        invitations: {
          where: { status: InvitationStatus.PENDING },
          include: {
            inviter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });
  }

  async findAll() {
    return db.organization.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string) {
    return db.organization.delete({ where: { id } });
  }

  async addMember(data: AddMemberDTO) {
    return db.organizationMember.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role ?? OrgRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async removeMember(organizationId: string, userId: string) {
    return db.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrgRole
  ) {
    return db.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
    });
  }

  async createInvitation(data: InviteMemberDTO) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return db.organizationInvitation.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: data.organizationId,
        email: data.email.toLowerCase(),
        role: data.role ?? OrgRole.MEMBER,
        inviterId: data.inviterId,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
    });
  }
}

class OrganizationService {
  private repository = new OrganizationRepository();

  async createOrganization(
    dto: CreateOrganizationDTO,
    ownerId: string
  ): Promise<ActionResult<OrganizationWithRelations>> {
    try {
      if (!dto.name || dto.name.trim().length === 0) {
        return {
          success: false,
          error: "El nombre de la organización es requerido",
          code: "REQUIRED_NAME",
        };
      }

      if (!dto.slug || dto.slug.trim().length === 0) {
        return {
          success: false,
          error: "El slug es requerido",
          code: "REQUIRED_SLUG",
        };
      }

      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(dto.slug)) {
        return {
          success: false,
          error:
            "El slug solo puede contener letras minúsculas, números y guiones",
          code: "INVALID_SLUG",
        };
      }

      const existingOrg = await db.organization.findUnique({
        where: { slug: dto.slug },
      });

      if (existingOrg) {
        return {
          success: false,
          error: "El slug ya está en uso",
          code: "SLUG_EXISTS",
        };
      }

      const organization = await this.repository.create(dto, ownerId);

      revalidatePath("/dashboard/admin/organizations");

      return {
        success: true,
        data: organization as OrganizationWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear organización",
        code: "CREATE_ERROR",
      };
    }
  }

  async updateOrganization(
    dto: UpdateOrganizationDTO
  ): Promise<ActionResult<OrganizationWithRelations>> {
    try {
      const organization = await this.repository.update(dto.id, dto);

      revalidatePath("/dashboard/admin/organizations");

      return {
        success: true,
        data: organization as OrganizationWithRelations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar organización",
        code: "UPDATE_ERROR",
      };
    }
  }

  async getOrganizationById(id: string): Promise<ActionResult> {
    try {
      const organization = await this.repository.findById(id);

      if (!organization) {
        return {
          success: false,
          error: "Organización no encontrada",
          code: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: organization,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener organización",
        code: "FETCH_ERROR",
      };
    }
  }

  async getAllOrganizations(): Promise<ActionResult> {
    try {
      const organizations = await this.repository.findAll();

      return {
        success: true,
        data: organizations,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener organizaciones",
        code: "FETCH_ERROR",
      };
    }
  }

  async deleteOrganization(id: string): Promise<ActionResult> {
    try {
      await this.repository.delete(id);

      revalidatePath("/dashboard/admin/organizations");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar organización",
        code: "DELETE_ERROR",
      };
    }
  }

  async addMember(
    dto: AddMemberDTO
  ): Promise<ActionResult<OrganizationMemberWithUser>> {
    try {
      const existingMember = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: dto.organizationId,
            userId: dto.userId,
          },
        },
      });

      if (existingMember) {
        return {
          success: false,
          error: "El usuario ya es miembro de esta organización",
          code: "ALREADY_MEMBER",
        };
      }

      const member = await this.repository.addMember(dto);

      revalidatePath("/dashboard/admin/organizations");

      return {
        success: true,
        data: member as OrganizationMemberWithUser,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al agregar miembro",
        code: "ADD_MEMBER_ERROR",
      };
    }
  }

  async removeMember(
    organizationId: string,
    userId: string
  ): Promise<ActionResult> {
    try {
      const member = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      });

      if (member?.role === OrgRole.OWNER) {
        return {
          success: false,
          error: "No se puede eliminar al propietario de la organización",
          code: "CANNOT_REMOVE_OWNER",
        };
      }

      await this.repository.removeMember(organizationId, userId);

      revalidatePath("/dashboard/admin/organizations");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar miembro",
        code: "REMOVE_MEMBER_ERROR",
      };
    }
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrgRole
  ): Promise<ActionResult> {
    try {
      await this.repository.updateMemberRole(organizationId, userId, role);

      revalidatePath("/dashboard/admin/organizations");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar rol",
        code: "UPDATE_ROLE_ERROR",
      };
    }
  }

  async inviteMember(
    dto: InviteMemberDTO
  ): Promise<ActionResult<OrganizationInvitation>> {
    try {
      const existingMember = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: dto.organizationId,
            userId: dto.inviterId,
          },
        },
      });

      if (!existingMember || existingMember.role === OrgRole.MEMBER) {
        return {
          success: false,
          error: "No tienes permisos para invitar miembros",
          code: "INSUFFICIENT_PERMISSIONS",
        };
      }

      const existingInvitation = await db.organizationInvitation.findUnique({
        where: {
          organizationId_email: {
            organizationId: dto.organizationId,
            email: dto.email.toLowerCase(),
          },
        },
      });

      if (
        existingInvitation &&
        existingInvitation.status === InvitationStatus.PENDING
      ) {
        return {
          success: false,
          error: "Ya existe una invitación pendiente para este email",
          code: "INVITATION_EXISTS",
        };
      }

      const invitation = await this.repository.createInvitation(dto);

      revalidatePath("/dashboard/admin/organizations");

      return {
        success: true,
        data: invitation as OrganizationInvitation,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al enviar invitación",
        code: "INVITE_ERROR",
      };
    }
  }
}

const organizationService = new OrganizationService();

export async function createOrganization(
  dto: CreateOrganizationDTO,
  ownerId: string
) {
  return organizationService.createOrganization(dto, ownerId);
}

export async function updateOrganization(dto: UpdateOrganizationDTO) {
  return organizationService.updateOrganization(dto);
}

export async function getOrganizationById(id: string) {
  return organizationService.getOrganizationById(id);
}

export async function getAllOrganizations() {
  return organizationService.getAllOrganizations();
}

export async function deleteOrganization(id: string) {
  return organizationService.deleteOrganization(id);
}

export async function addOrganizationMember(dto: AddMemberDTO) {
  return organizationService.addMember(dto);
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string
) {
  return organizationService.removeMember(organizationId, userId);
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: OrgRole
) {
  return organizationService.updateMemberRole(organizationId, userId, role);
}

export async function inviteOrganizationMember(dto: InviteMemberDTO) {
  return organizationService.inviteMember(dto);
}
