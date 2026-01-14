// src/components/administration/departments/department-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createDepartment,
  updateDepartment,
} from "@/lib/actions/department-actions";
import type {
  CreateDepartmentDTO,
  DepartmentWithRelations,
  UpdateDepartmentDTO,
} from "@/lib/actions/types/action-types";

const departmentFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentWithRelations | null;
  departments: DepartmentWithRelations[];
  onSuccess: () => void;
}

export function DepartmentFormDrawer({
  open,
  onOpenChange,
  department,
  departments,
  onSuccess,
}: DepartmentFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!department;

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "",
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        description: department.description ?? "",
        parentId: department.parentId ?? "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        parentId: "",
      });
    }
  }, [department, form]);

  async function onSubmit(values: DepartmentFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && department) {
        const dto: UpdateDepartmentDTO = {
          id: department.id,
          name: values.name,
          description: values.description || undefined,
          parentId: values.parentId || undefined,
        };

        const result = await updateDepartment(dto);

        if (result.success) {
          toast.success("Departamento actualizado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar departamento");
        }
      } else {
        const dto: CreateDepartmentDTO = {
          name: values.name,
          description: values.description,
          parentId: values.parentId || undefined,
        };

        const result = await createDepartment(dto);

        if (result.success) {
          toast.success("Departamento creado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear departamento");
        }
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  const availableParents = departments.filter((d) => d.id !== department?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar departamento" : "Crear nuevo departamento"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del departamento"
              : "Completa los datos para crear un nuevo departamento"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ventas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descripción del departamento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento padre</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin departamento padre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin departamento padre</SelectItem>
                      {availableParents.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona un departamento padre para crear una jerarquía
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
