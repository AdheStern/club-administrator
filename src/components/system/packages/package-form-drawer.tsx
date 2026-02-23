// src/components/system/packages/package-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createPackage, updatePackage } from "@/lib/actions/package-actions";
import { getSectors } from "@/lib/actions/sector-actions";
import type {
  CreatePackageDTO,
  PackageWithRelations,
  UpdatePackageDTO,
} from "@/lib/actions/types/package-types";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import { cn } from "@/lib/utils";

const packageFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().optional(),
  includedPeople: z
    .number()
    .min(1, "Debe incluir al menos 1 persona")
    .max(50, "No puede exceder 50 personas"),
  basePrice: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(999999.99, "El precio no puede exceder 999,999.99"),
  extraPersonPrice: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(999999.99, "El precio no puede exceder 999,999.99")
    .optional(),
  sectorIds: z.array(z.string()),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

interface PackageFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: PackageWithRelations | null;
  onSuccess: () => void;
}

export function PackageFormDrawer({
  open,
  onOpenChange,
  package: pkg,
  onSuccess,
}: PackageFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sectors, setSectors] = useState<SectorWithRelations[]>([]);
  const [sectorPopoverOpen, setSectorPopoverOpen] = useState(false);
  const isEdit = !!pkg;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      includedPeople: 4,
      basePrice: 0,
      extraPersonPrice: 0,
      sectorIds: [],
    },
  });

  useEffect(() => {
    getSectors({ isActive: true }, { pageSize: 100 }).then((result) => {
      if (result.success && result.data) {
        setSectors(result.data.data);
      }
    });
  }, []);

  useEffect(() => {
    if (pkg) {
      form.reset({
        name: pkg.name,
        description: pkg.description ?? "",
        includedPeople: pkg.includedPeople,
        basePrice: Number(pkg.basePrice),
        extraPersonPrice: pkg.extraPersonPrice
          ? Number(pkg.extraPersonPrice)
          : undefined,
        sectorIds: pkg.packageSectors.map((ps) => ps.sectorId),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        includedPeople: 4,
        basePrice: 0,
        extraPersonPrice: 0,
        sectorIds: [],
      });
    }
  }, [pkg, form]);

  function toggleSector(sectorId: string, current: string[]) {
    return current.includes(sectorId)
      ? current.filter((id) => id !== sectorId)
      : [...current, sectorId];
  }

  async function onSubmit(values: PackageFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && pkg) {
        const dto: UpdatePackageDTO = {
          id: pkg.id,
          name: values.name,
          description: values.description,
          includedPeople: values.includedPeople,
          basePrice: values.basePrice,
          extraPersonPrice: values.extraPersonPrice,
          sectorIds: values.sectorIds,
        };

        const result = await updatePackage(dto);

        if (result.success) {
          toast.success("Paquete actualizado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar paquete");
        }
      } else {
        const dto: CreatePackageDTO = {
          name: values.name,
          description: values.description,
          includedPeople: values.includedPeople,
          basePrice: values.basePrice,
          extraPersonPrice: values.extraPersonPrice,
          sectorIds: values.sectorIds,
        };

        const result = await createPackage(dto);

        if (result.success) {
          toast.success("Paquete creado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear paquete");
        }
      }
    } catch {
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
            {isEdit ? "Editar paquete" : "Crear nuevo paquete"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del paquete"
              : "Completa los datos para crear un nuevo paquete"}
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
                  <FormLabel>Nombre del paquete</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Paquete VIP" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre que identifica al paquete
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
                      placeholder="Ej: Incluye bebidas premium y acceso VIP"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descripción del paquete
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includedPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personas incluidas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Cantidad de personas incluidas en el paquete
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio base (Bs.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="500.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Precio del paquete con las personas incluidas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extraPersonPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio persona extra (Bs.) - Opcional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Costo adicional por persona extra
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sectores disponibles</FormLabel>
                  <Popover
                    open={sectorPopoverOpen}
                    onOpenChange={setSectorPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            field.value.length === 0 && "text-muted-foreground",
                          )}
                        >
                          {field.value.length === 0
                            ? "Todos los sectores"
                            : `${field.value.length} sector${field.value.length > 1 ? "es" : ""} seleccionado${field.value.length > 1 ? "s" : ""}`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar sector..." />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron sectores
                          </CommandEmpty>
                          <CommandGroup>
                            {sectors.map((sector) => (
                              <CommandItem
                                key={sector.id}
                                value={sector.name}
                                onSelect={() => {
                                  field.onChange(
                                    toggleSector(sector.id, field.value),
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value.includes(sector.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {sector.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value.map((sectorId) => {
                        const sector = sectors.find((s) => s.id === sectorId);
                        return sector ? (
                          <Badge
                            key={sectorId}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              field.onChange(
                                toggleSector(sectorId, field.value),
                              )
                            }
                          >
                            {sector.name} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  <FormDescription>
                    Sin selección el paquete estará disponible en todos los
                    sectores
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
