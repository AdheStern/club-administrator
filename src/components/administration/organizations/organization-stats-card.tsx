// src/components/administration/organizations/organization-stats-card.tsx

import { Building, Mail, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrganizationStatsCardProps {
  totalOrganizations: number;
  totalMembers: number;
  pendingInvitations: number;
  className?: string;
}

export function OrganizationStatsCard({
  totalOrganizations,
  totalMembers,
  pendingInvitations,
  className,
}: OrganizationStatsCardProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Organizaciones</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">
            Organizaciones activas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Miembros</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <p className="text-xs text-muted-foreground">Total de miembros</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invitaciones</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingInvitations}</div>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent>
      </Card>
    </div>
  );
}
