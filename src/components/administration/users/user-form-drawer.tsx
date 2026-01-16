// src/components/administration/users/user-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  getAllSectors,
  getUserSectors,
  updateUserSectors,
} from "@/lib/actions/user-sector-actions";

const userFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  sectorIds: z.array(z.string()).optional(),
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

interface Sector {
  id: string;
  name: string;
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
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
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
      sectorIds: [],
    },
  });

  useEffect(() => {
    const loadSectors = async () => {
      const result = await getAllSectors();
      if (result.success && result.data) {
        setSectors(result.data);
      }
    };
    loadSectors();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const userSectorsResult = await getUserSectors(user.id);
        const userSectorIds =
          userSectorsResult.success && userSectorsResult.data
            ? userSectorsResult.data.map((s) => s.id)
            : [];

        setSelectedSectors(userSectorIds);

        form.reset({
          name: user.name,
          email: user.email,
          role: user.role as UserRoleType,
          status: user.status as UserStatusType,
          departmentId: user.department?.id ?? "",
          managerId: user.manager?.id ?? "",
          sectorIds: userSectorIds,
        });
      } else {
        setSelectedSectors([]);
        form.reset({
          name: "",
          email: "",
          password: "",
          role: "USER",
          status: "ACTIVE",
          departmentId: "",
          managerId: "",
          sectorIds: [],
        });
      }
    };

    if (open) {
      loadUserData();
    }
  }, [user, form, open]);

  const toggleSector = (sectorId: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId)
        ? prev.filter((id) => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  const removeSector = (sectorId: string) => {
    setSelectedSectors((prev) => prev.filter((id) => id !== sectorId));
  };

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
          await updateUserSectors(user.id, selectedSectors);
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

        if (result.success && result.data) {
          await updateUserSectors(result.data.id, selectedSectors);
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

  const selectedSectorNames = sectors
    .filter((s) => selectedSectors.includes(s.id))
    .map((s) => s.name);

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
                      Mínimo 8 caracteres con mayúsculas, minúsculas y números
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

            <FormItem>
              <FormLabel>Sectores permitidos</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      {selectedSectors.length === 0
                        ? "Seleccionar sectores"
                        : `${selectedSectors.length} sector(es) seleccionado(s)`}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                    {sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={sector.id}
                          checked={selectedSectors.includes(sector.id)}
                          onCheckedChange={() => toggleSector(sector.id)}
                        />
                        <label
                          htmlFor={sector.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {sector.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedSectorNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSectorNames.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                      <button
                        type="button"
                        onClick={() =>
                          removeSector(
                            sectors.find((s) => s.name === name)?.id || ""
                          )
                        }
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormDescription>
                Los usuarios pueden acceder solo a los sectores seleccionados.
                Admins y Super Admins tienen acceso a todos.
              </FormDescription>
            </FormItem>

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
