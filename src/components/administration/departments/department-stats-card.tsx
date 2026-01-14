// src/components/administration/departments/department-stats-card.tsx

import { Building2, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DepartmentStatsCardProps {
  totalDepartments: number;
  totalEmployees: number;
  avgEmployeesPerDept: number;
  className?: string;
}

export function DepartmentStatsCard({
  totalDepartments,
  totalEmployees,
  avgEmployeesPerDept,
  className,
}: DepartmentStatsCardProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Departamentos
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDepartments}</div>
          <p className="text-xs text-muted-foreground">
            Estructura organizacional
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Distribuidos en departamentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgEmployeesPerDept.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Empleados por departamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
