// src/components/administration/shared/status-badge.tsx

import { Badge } from "@/components/ui/badge";
import type { UserStatusType } from "@/lib/actions/types/action-types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: UserStatusType;
  className?: string;
}

const statusConfig: Record<
  UserStatusType,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  ACTIVE: {
    label: "Activo",
    variant: "default",
  },
  INACTIVE: {
    label: "Inactivo",
    variant: "secondary",
  },
  SUSPENDED: {
    label: "Suspendido",
    variant: "destructive",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return null;
  }

  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label}
    </Badge>
  );
}
