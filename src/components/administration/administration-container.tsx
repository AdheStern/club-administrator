// src/components/administration/administration-container.tsx

"use client";

import { Building, Building2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllDepartments,
  getDepartmentHierarchy,
} from "@/lib/actions/department-actions";
import { getAllOrganizations } from "@/lib/actions/organization-actions";
import type {
  DepartmentWithRelations,
  UserWithRelations,
} from "@/lib/actions/types/action-types";
import { getUsers } from "@/lib/actions/user-actions";
import { DepartmentList } from "./departments/department-list";
import { OrganizationList } from "./organizations/organization-list";
import { UserList } from "./users/user-list";
import { UserStatsCard } from "./users/user-stats-card";

interface DepartmentNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: DepartmentNode[];
  userCount: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  _count: { members: number };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
}

interface AdministrationContainerProps {
  userId: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdministrationContainer({
  userId,
}: AdministrationContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([]);
  const [hierarchy, setHierarchy] = useState<DepartmentNode[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, departmentsResult, hierarchyResult, orgsResult] =
        await Promise.all([
          getUsers(),
          getAllDepartments(),
          getDepartmentHierarchy(),
          getAllOrganizations(),
        ]);

      setUsers(
        usersResult.success && usersResult.data?.data
          ? usersResult.data.data
          : []
      );
      setDepartments(
        departmentsResult.success && departmentsResult.data
          ? departmentsResult.data
          : []
      );
      setHierarchy(
        hierarchyResult.success && hierarchyResult.data
          ? hierarchyResult.data
          : []
      );
      setOrganizations(
        orgsResult.success && orgsResult.data ? orgsResult.data : []
      );
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userStats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN")
      .length,
    newThisMonth: users.filter((u) => {
      const created = new Date(u.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Administración
            </h2>
            <p className="text-muted-foreground">
              Gestiona usuarios, departamentos y organizaciones
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administración</h2>
          <p className="text-muted-foreground">
            Gestiona usuarios, departamentos y organizaciones
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="organizations" className="gap-2">
            <Building className="h-4 w-4" />
            Organizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <UserStatsCard
              title="Total Usuarios"
              value={userStats.total}
              description="Usuarios registrados"
              icon={Users}
            />
            <UserStatsCard
              title="Usuarios Activos"
              value={userStats.active}
              description={
                userStats.total > 0
                  ? `${((userStats.active / userStats.total) * 100).toFixed(
                      0
                    )}% del total`
                  : "Sin usuarios"
              }
              icon={Users}
            />
            <UserStatsCard
              title="Administradores"
              value={userStats.admins}
              description="Con permisos elevados"
              icon={Users}
            />
            <UserStatsCard
              title="Nuevos este mes"
              value={userStats.newThisMonth}
              description="Registros recientes"
              icon={Users}
              trend={
                userStats.newThisMonth > 0
                  ? {
                      value: 12,
                      isPositive: true,
                    }
                  : undefined
              }
            />
          </div>

          <UserList
            initialUsers={users}
            departments={departments}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <DepartmentList
            initialDepartments={departments}
            hierarchy={hierarchy}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganizationList
            initialOrganizations={organizations}
            currentUserId={userId}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
