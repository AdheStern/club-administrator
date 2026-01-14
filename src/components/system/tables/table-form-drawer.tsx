// src/components/system/tables/table-form-drawer.tsx

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
import { createTable, updateTable } from "@/lib/actions/table-actions";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type {
  CreateTableDTO,
  TableWithRelations,
  UpdateTableDTO,
} from "@/lib/actions/types/table-types";

const tableFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  sectorId: z.string().min(1, "El sector es requerido"),
  capacity: z
    .number()
    .min(1, "La capacidad debe ser mayor a 0")
    .max(100, "La capacidad no puede exceder 100"),
  tableType: z.enum(["VIP", "COMMON", "LOUNGE", "PREMIUM"]),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

interface TableFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: TableWithRelations | null;
  sectors: SectorWithRelations[];
  onSuccess: () => void;
}

export function TableFormDrawer({
  open,
  onOpenChange,
  table,
  sectors,
  onSuccess,
}: TableFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!table;

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: "",
      sectorId: "",
      capacity: 4,
      tableType: "COMMON",
    },
  });

  useEffect(() => {
    if (table) {
      form.reset({
        name: table.name,
        sectorId: table.sectorId,
        capacity: table.capacity,
        tableType: table.tableType as "VIP" | "COMMON" | "LOUNGE" | "PREMIUM",
      });
    } else {
      form.reset({
        name: "",
        sectorId: "",
        capacity: 4,
        tableType: "COMMON",
      });
    }
  }, [table, form]);

  async function onSubmit(values: TableFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && table) {
        const dto: UpdateTableDTO = {
          id: table.id,
          name: values.name,
          sectorId: values.sectorId,
          capacity: values.capacity,
          tableType: values.tableType,
        };

        const result = await updateTable(dto);

        if (result.success) {
          toast.success("Mesa actualizada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar mesa");
        }
      } else {
        const dto: CreateTableDTO = {
          name: values.name,
          sectorId: values.sectorId,
          capacity: values.capacity,
          tableType: values.tableType,
        };

        const result = await createTable(dto);

        if (result.success) {
          toast.success("Mesa creada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear mesa");
        }
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  const activeSectors = sectors.filter((s) => s.isActive);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar mesa" : "Crear nueva mesa"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos de la mesa"
              : "Completa los datos para crear una nueva mesa"}
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
                  <FormLabel>Nombre de la mesa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Mesa 1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre único dentro del sector
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Sector al que pertenece la mesa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tableType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de mesa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMMON">Común</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="LOUNGE">Lounge</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Categoría de la mesa</FormDescription>
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
                      placeholder="4"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número de personas que caben en la mesa
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
