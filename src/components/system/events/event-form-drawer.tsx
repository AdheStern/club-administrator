// src/components/system/events/event-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, updateEvent } from "@/lib/actions/event-actions";
import type {
  CreateEventDTO,
  EventWithRelations,
  UpdateEventDTO,
} from "@/lib/actions/types/event-types";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { cn } from "@/lib/utils";

const eventFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  description: z.string().optional(),
  eventDate: z.date({
    required_error: "La fecha del evento es requerida",
  }),
  visibilityStart: z.date({
    required_error: "La fecha de inicio de visibilidad es requerida",
  }),
  visibilityEnd: z.date({
    required_error: "La fecha de fin de visibilidad es requerida",
  }),
  sectorIds: z.array(z.string()).min(1, "Debe seleccionar al menos un sector"),
  tableIds: z.array(z.string()).min(1, "Debe seleccionar al menos una mesa"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithRelations | null;
  sectors: SectorWithRelations[];
  tables: TableWithRelations[];
  onSuccess: () => void;
}

export function EventFormDrawer({
  open,
  onOpenChange,
  event,
  sectors,
  tables,
  onSuccess,
}: EventFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: new Date(),
      visibilityStart: new Date(),
      visibilityEnd: new Date(),
      sectorIds: [],
      tableIds: [],
    },
  });

  const selectedSectorIds = form.watch("sectorIds");

  const availableTables = tables.filter((table) =>
    selectedSectorIds.includes(table.sectorId)
  );

  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description ?? "",
        eventDate: new Date(event.eventDate),
        visibilityStart: new Date(event.visibilityStart),
        visibilityEnd: new Date(event.visibilityEnd),
        sectorIds: event.eventSectors.map((es) => es.sector.id),
        tableIds: event.eventTables.map((et) => et.table.id),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        eventDate: new Date(),
        visibilityStart: new Date(),
        visibilityEnd: new Date(),
        sectorIds: [],
        tableIds: [],
      });
    }
  }, [event, form]);

  useEffect(() => {
    const currentTableIds = form.getValues("tableIds");
    const validTableIds = currentTableIds.filter((tableId) =>
      availableTables.some((t) => t.id === tableId)
    );

    if (validTableIds.length !== currentTableIds.length) {
      form.setValue("tableIds", validTableIds);
    }
  }, [selectedSectorIds, form, availableTables]);

  const handleSelectAllSectors = () => {
    const activeSectors = sectors.filter((s) => s.isActive);
    form.setValue(
      "sectorIds",
      activeSectors.map((s) => s.id)
    );
  };

  const handleSelectAllTables = () => {
    form.setValue(
      "tableIds",
      availableTables.map((t) => t.id)
    );
  };

  async function onSubmit(values: EventFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && event) {
        const dto: UpdateEventDTO = {
          id: event.id,
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          visibilityStart: values.visibilityStart,
          visibilityEnd: values.visibilityEnd,
          sectorIds: values.sectorIds,
          tableIds: values.tableIds,
        };

        const result = await updateEvent(dto);

        if (result.success) {
          toast.success("Evento actualizado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar evento");
        }
      } else {
        const dto: CreateEventDTO = {
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          visibilityStart: values.visibilityStart,
          visibilityEnd: values.visibilityEnd,
          sectorIds: values.sectorIds,
          tableIds: values.tableIds,
        };

        const result = await createEvent(dto);

        if (result.success) {
          toast.success("Evento creado correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear evento");
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
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar evento" : "Crear nuevo evento"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del evento"
              : "Completa los datos para crear un nuevo evento"}
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
                  <FormLabel>Nombre del evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Noche de Gala 2024" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre que identifica al evento
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
                      placeholder="Ej: Evento especial con DJ internacional"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descripción del evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha del evento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Fecha en la que se realizará el evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visibilityStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Visible desde</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: es })
                            ) : (
                              <span>Fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibilityEnd"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Visible hasta</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: es })
                            ) : (
                              <span>Fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sectorIds"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Sectores disponibles</FormLabel>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleSelectAllSectors}
                      className="h-auto p-0"
                    >
                      Seleccionar todos
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                    {activeSectors.map((sector) => (
                      <FormField
                        key={sector.id}
                        control={form.control}
                        name="sectorIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={sector.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sector.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          sector.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== sector.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {sector.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Selecciona los sectores disponibles para este evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tableIds"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Mesas disponibles</FormLabel>
                    {availableTables.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleSelectAllTables}
                        className="h-auto p-0"
                      >
                        Seleccionar todas
                      </Button>
                    )}
                  </div>
                  {availableTables.length === 0 ? (
                    <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Selecciona sectores para ver las mesas disponibles
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                      {activeSectors
                        .filter((sector) =>
                          selectedSectorIds.includes(sector.id)
                        )
                        .map((sector) => {
                          const sectorTables = availableTables.filter(
                            (t) => t.sectorId === sector.id
                          );

                          if (sectorTables.length === 0) return null;

                          return (
                            <div key={sector.id} className="mb-4 last:mb-0">
                              <h4 className="font-medium text-sm mb-2">
                                {sector.name}
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                {sectorTables.map((table) => (
                                  <FormField
                                    key={table.id}
                                    control={form.control}
                                    name="tableIds"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={table.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                table.id
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...field.value,
                                                      table.id,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) =>
                                                          value !== table.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {table.name}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  <FormDescription>
                    Selecciona las mesas disponibles para este evento
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
