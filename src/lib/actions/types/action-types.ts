// src/lib/actions/types/action-types.ts

import type { Prisma } from "@prisma/client";

/**
 * Tipos de roles y estados como strings
 */
export type UserRoleType = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "USER";
export type UserStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type OrgRoleType = "OWNER" | "ADMIN" | "MEMBER";
export type InvitationStatusType =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

/**
 * Resultado genérico de acciones
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * DTOs para User
 */
export interface CreateUserDTO {
  name: string;
  email: string;
  password?: string;
  role?: UserRoleType;
  status?: UserStatusType;
  departmentId?: string;
  managerId?: string;
  image?: string;
}

export interface UpdateUserDTO {
  id: string;
  name?: string;
  email?: string;
  role?: UserRoleType;
  status?: UserStatusType;
  departmentId?: string;
  managerId?: string;
  image?: string;
}

export interface UserFilters {
  role?: UserRoleType;
  status?: UserStatusType;
  departmentId?: string;
  managerId?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * DTOs para Department
 */
export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateDepartmentDTO {
  id: string;
  name?: string;
  description?: string;
  parentId?: string;
}

export interface DepartmentWithRelations {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string }[];
  _count: { users: number };
}

export interface DepartmentDetail extends DepartmentWithRelations {
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRoleType;
  }[];
}

/**
 * DTOs para Organization
 */
export interface CreateOrganizationDTO {
  name: string;
  slug: string;
  logo?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateOrganizationDTO {
  id: string;
  name?: string;
  slug?: string;
  logo?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface AddMemberDTO {
  organizationId: string;
  userId: string;
  role?: OrgRoleType;
}

export interface InviteMemberDTO {
  organizationId: string;
  email: string;
  role?: OrgRoleType;
  inviterId: string;
}

export interface OrganizationWithRelations {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number };
}

export interface OrganizationMemberWithUser {
  id: string;
  role: OrgRoleType;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrgRoleType;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  inviterId: string;
  status: InvitationStatusType;
}

/**
 * Tipos de respuesta con datos
 */
export interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  status: UserStatusType;
  image: string | null;
  department: { id: string; name: string } | null;
  manager: { id: string; name: string } | null;
  subordinates: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Constantes para valores válidos
 */
export const USER_ROLES: Record<UserRoleType, UserRoleType> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
};

export const USER_STATUSES: Record<UserStatusType, UserStatusType> = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
};

export const ORG_ROLES: Record<OrgRoleType, OrgRoleType> = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
};

export const INVITATION_STATUSES: Record<
  InvitationStatusType,
  InvitationStatusType
> = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
};
