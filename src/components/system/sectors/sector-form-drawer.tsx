// src/components/system/sectors/sector-form-drawer.tsx

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
import { Textarea } from "@/components/ui/textarea";
import { createSector, updateSector } from "@/lib/actions/sector-actions";
import type {
  CreateSectorDTO,
  SectorWithRelations,
  UpdateSectorDTO,
} from "@/lib/actions/types/sector-types";

const sectorFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().optional(),
  capacity: z
    .number()
    .min(1, "La capacidad debe ser mayor a 0")
    .max(10000, "La capacidad no puede exceder 10000"),
});

type SectorFormValues = z.infer<typeof sectorFormSchema>;

interface SectorFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector?: SectorWithRelations | null;
  onSuccess: () => void;
}

export function SectorFormDrawer({
  open,
  onOpenChange,
  sector,
  onSuccess,
}: SectorFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!sector;

  const form = useForm<SectorFormValues>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 50,
    },
  });

  useEffect(() => {
    if (sector) {
      form.reset({
        name: sector.name,
        description: sector.description ?? "",
        capacity: sector.capacity,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        capacity: 50,
      });
    }
  }, [sector, form]);

  async function onSubmit(values: SectorFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && sector) {
        const dto: UpdateSectorDTO = {
          id: sector.id,
          name: values.name,
          description: values.description,
          capacity: values.capacity,
        };

        const result = await updateSector(dto);

        if (result.success) {
          toast.success("Sector actualizado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar sector");
        }
      } else {
        const dto: CreateSectorDTO = {
          name: values.name,
          description: values.description,
          capacity: values.capacity,
        };

        const result = await createSector(dto);

        if (result.success) {
          toast.success("Sector creado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear sector");
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
            {isEdit ? "Editar sector" : "Crear nuevo sector"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del sector"
              : "Completa los datos para crear un nuevo sector"}
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
                  <FormLabel>Nombre del sector</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sector VIP" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre único que identifica al sector
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Sector principal con vista al escenario"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descripción del sector
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número máximo de personas en el sector
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
