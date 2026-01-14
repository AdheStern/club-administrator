// src/components/administration/shared/role-badge.tsx

import { Shield, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  OrgRoleType,
  UserRoleType,
} from "@/lib/actions/types/action-types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRoleType | OrgRoleType;
  className?: string;
}

const userRoleConfig: Record<
  UserRoleType,
  { label: string; icon: React.ElementType; color: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: ShieldAlert,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  MANAGER: {
    label: "Manager",
    icon: Shield,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  USER: {
    label: "Usuario",
    icon: User,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
};

const orgRoleConfig: Record<
  OrgRoleType,
  { label: string; icon: React.ElementType; color: string }
> = {
  OWNER: {
    label: "Owner",
    icon: ShieldAlert,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  MEMBER: {
    label: "Miembro",
    icon: User,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const isOrgRole = ["OWNER", "ADMIN", "MEMBER"].includes(role);
  const config = isOrgRole
    ? orgRoleConfig[role as OrgRoleType]
    : userRoleConfig[role as UserRoleType];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium gap-1.5", config.color, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
