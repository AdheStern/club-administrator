// src/components/administration/users/user-form-drawer.tsx

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
import type {
  CreateUserDTO,
  DepartmentWithRelations,
  UpdateUserDTO,
  UserRoleType,
  UserStatusType,
  UserWithRelations,
} from "@/lib/actions/types/action-types";
import { createUser, updateUser } from "@/lib/actions/user-actions";

const userFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithRelations | null;
  departments: DepartmentWithRelations[];
  managers: UserWithRelations[];
  onSuccess: () => void;
}

export function UserFormDrawer({
  open,
  onOpenChange,
  user,
  departments,
  managers,
  onSuccess,
}: UserFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      status: "ACTIVE",
      departmentId: "",
      managerId: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role as UserRoleType,
        status: user.status as UserStatusType,
        departmentId: user.department?.id ?? "",
        managerId: user.manager?.id ?? "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "USER",
        status: "ACTIVE",
        departmentId: "",
        managerId: "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: UserFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && user) {
        const dto: UpdateUserDTO = {
          id: user.id,
          name: values.name,
          email: values.email,
          role: values.role as UserRoleType,
          status: values.status as UserStatusType,
          departmentId: values.departmentId || undefined,
          managerId: values.managerId || undefined,
        };

        const result = await updateUser(dto);

        if (result.success) {
          toast.success("Usuario actualizado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar usuario");
        }
      } else {
        const dto: CreateUserDTO = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role as UserRoleType,
          status: values.status as UserStatusType,
          departmentId: values.departmentId || undefined,
          managerId: values.managerId || undefined,
        };

        const result = await createUser(dto);

        if (result.success) {
          toast.success("Usuario creado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear usuario");
        }
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar usuario" : "Crear nuevo usuario"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del usuario"
              : "Completa los datos para crear un nuevo usuario"}
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
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  {isEdit && (
                    <FormDescription>
                      El email no se puede modificar
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Dejar vacío para enviar email de activación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">Usuario</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? "" : value);
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin departamento</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? "" : value);
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin manager</SelectItem>
                      {managers
                        .filter((m) => m.id !== user?.id)
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
