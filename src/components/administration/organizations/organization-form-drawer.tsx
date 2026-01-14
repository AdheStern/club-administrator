// src/components/administration/organizations/organization-form-drawer.tsx

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createOrganization,
  updateOrganization,
} from "@/lib/actions/organization-actions";
import type {
  CreateOrganizationDTO,
  OrganizationWithRelations,
  UpdateOrganizationDTO,
} from "@/lib/actions/types/action-types";

const organizationFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Solo letras minúsculas, números y guiones permitidos"
    ),
  logo: z.string().url("URL inválida").optional().or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface OrganizationFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: OrganizationWithRelations | null;
  currentUserId: string;
  onSuccess: () => void;
}

export function OrganizationFormDrawer({
  open,
  onOpenChange,
  organization,
  currentUserId,
  onSuccess,
}: OrganizationFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!organization;

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo ?? "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        logo: "",
      });
    }
  }, [organization, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  async function onSubmit(values: OrganizationFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && organization) {
        const dto: UpdateOrganizationDTO = {
          id: organization.id,
          name: values.name,
          slug: values.slug,
          logo: values.logo || undefined,
        };

        const result = await updateOrganization(dto);

        if (result.success) {
          toast.success("Organización actualizada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar organización");
        }
      } else {
        const dto: CreateOrganizationDTO = {
          name: values.name,
          slug: values.slug,
          logo: values.logo || undefined,
        };

        const result = await createOrganization(dto, currentUserId);

        if (result.success) {
          toast.success("Organización creada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear organización");
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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar organización" : "Crear nueva organización"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos de la organización"
              : "Completa los datos para crear una nueva organización"}
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
                  <FormLabel>Nombre de la organización</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mi Empresa"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!isEdit) {
                          form.setValue("slug", generateSlug(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (identificador único)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mi-empresa"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  {isEdit ? (
                    <FormDescription>
                      El slug no se puede modificar
                    </FormDescription>
                  ) : (
                    <FormDescription>
                      Se genera automáticamente del nombre
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo (URL)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://ejemplo.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
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
