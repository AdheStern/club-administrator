// src/lib/utils/permissions.ts

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "USER";

interface PermissionConfig {
  allowedRoles: UserRole[];
}

const PERMISSIONS: Record<string, PermissionConfig> = {
  VIEW_ADMINISTRATION: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_USERS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_DEPARTMENTS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_ORGANIZATIONS: {
    allowedRoles: ["SUPER_ADMIN"],
  },
  APPROVE_REQUESTS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  CREATE_REQUESTS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
  },
  MANAGE_EVENTS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_PACKAGES: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_SECTORS: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  MANAGE_TABLES: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
};

export namespace PermissionService {
  export function hasPermission(
    userRole: UserRole,
    permission: keyof typeof PERMISSIONS
  ): boolean {
    const config = PERMISSIONS[permission];
    if (!config) {
      return false;
    }
    return config.allowedRoles.includes(userRole);
  }

  export function hasAnyPermission(
    userRole: UserRole,
    permissions: (keyof typeof PERMISSIONS)[]
  ): boolean {
    return permissions.some((permission) =>
      hasPermission(userRole, permission)
    );
  }

  export function hasAllPermissions(
    userRole: UserRole,
    permissions: (keyof typeof PERMISSIONS)[]
  ): boolean {
    return permissions.every((permission) =>
      hasPermission(userRole, permission)
    );
  }

  export function canAccessRoute(userRole: UserRole, route: string): boolean {
    const routePermissions: Record<string, keyof typeof PERMISSIONS> = {
      "/administration": "VIEW_ADMINISTRATION",
      "/administration/users": "MANAGE_USERS",
      "/administration/departments": "MANAGE_DEPARTMENTS",
      "/administration/organizations": "MANAGE_ORGANIZATIONS",
      "/requests/approve": "APPROVE_REQUESTS",
      "/events": "MANAGE_EVENTS",
      "/packages": "MANAGE_PACKAGES",
      "/sectors": "MANAGE_SECTORS",
      "/tables": "MANAGE_TABLES",
    };

    const permission = routePermissions[route];
    if (!permission) {
      return true;
    }

    return hasPermission(userRole, permission);
  }
}

export function checkPermission(
  userRole: UserRole,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PermissionService.hasPermission(userRole, permission);
}

export function requirePermission(
  userRole: UserRole,
  permission: keyof typeof PERMISSIONS
): void {
  if (!PermissionService.hasPermission(userRole, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
