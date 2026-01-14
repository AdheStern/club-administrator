// src/components/administration/departments/department-list.tsx

"use client";

import {
  GitBranch,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteDepartment } from "@/lib/actions/department-actions";
import type { DepartmentWithRelations } from "@/lib/actions/types/action-types";
import { DepartmentFormDrawer } from "./department-form-drawer";
import { DepartmentStatsCard } from "./department-stats-card";
import { DepartmentTree } from "./department-tree";

interface DepartmentNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: DepartmentNode[];
  userCount: number;
}

interface DepartmentListProps {
  initialDepartments: DepartmentWithRelations[];
  hierarchy: DepartmentNode[];
  onRefresh: () => void;
}

export function DepartmentList({
  initialDepartments,
  hierarchy,
  onRefresh,
}: DepartmentListProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<DepartmentWithRelations | null>(null);

  const stats = useMemo(() => {
    const totalDepartments = initialDepartments.length;
    const totalEmployees = initialDepartments.reduce(
      (sum, dept) => sum + dept._count.users,
      0
    );
    const avgEmployeesPerDept =
      totalDepartments > 0 ? totalEmployees / totalDepartments : 0;

    return { totalDepartments, totalEmployees, avgEmployeesPerDept };
  }, [initialDepartments]);

  const handleEdit = (department: DepartmentWithRelations) => {
    setSelectedDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = (department: DepartmentWithRelations) => {
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    const result = await deleteDepartment(departmentToDelete.id);

    if (result.success) {
      toast.success("Departamento eliminado correctamente");
      onRefresh();
    } else {
      toast.error(result.error || "Error al eliminar departamento");
    }

    setIsDeleteDialogOpen(false);
    setDepartmentToDelete(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <>
      <div className="space-y-6">
        <DepartmentStatsCard
          totalDepartments={stats.totalDepartments}
          totalEmployees={stats.totalEmployees}
          avgEmployeesPerDept={stats.avgEmployeesPerDept}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Departamentos</CardTitle>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo departamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="tree">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Vista jerárquica
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="mr-2 h-4 w-4" />
                  Vista de lista
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tree" className="mt-6">
                <DepartmentTree
                  hierarchy={hierarchy}
                  onSelect={(node) => {
                    const dept = initialDepartments.find(
                      (d) => d.id === node.id
                    );
                    if (dept) {
                      setSelectedDepartment(dept);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="list" className="mt-6">
                <div className="space-y-2">
                  {initialDepartments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{dept.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {dept._count.users} empleados
                          </Badge>
                        </div>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {dept.description}
                          </p>
                        )}
                        {dept.parent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Depende de: {dept.parent.name}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(dept)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(dept)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <DepartmentFormDrawer
        open={isFormOpen}
        onOpenChange={handleFormClose}
        department={selectedDepartment}
        departments={initialDepartments}
        onSuccess={() => {
          onRefresh();
          handleFormClose();
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar departamento?"
        description={`¿Estás seguro de que deseas eliminar el departamento ${departmentToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
