// src/components/system/requests/request-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createRequest,
  getAvailableTablesForEvent,
  updateRequest,
} from "@/lib/actions/request-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import type {
  CreateRequestDTO,
  RequestWithRelations,
  UpdateRequestDTO,
} from "@/lib/actions/types/request-types";
import { cn } from "@/lib/utils";
import { GuestAutocomplete } from "./guest-autocomplete";

const guestSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  identityCard: z.string().min(5, "El CI debe tener al menos 5 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
});

const requestFormSchema = z.object({
  eventId: z.string().min(1, "El evento es requerido"),
  sectorId: z.string().min(1, "El sector es requerido"),
  tableId: z.string().min(1, "La mesa es requerida"),
  packageId: z.string().min(1, "El paquete es requerido"),
  clientName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  clientIdentityCard: z
    .string()
    .min(5, "El CI debe tener al menos 5 caracteres"),
  clientPhone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  clientInstagramHandle: z.string().optional(),
  hasConsumption: z.boolean(),
  extraGuests: z.number().min(0, "No puede ser negativo"),
  guestList: z.array(guestSchema),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface AvailableTable {
  id: string;
  name: string;
  sectorId: string;
  sectorName: string;
  requiresGuestList: boolean;
}

interface AvailableSector {
  id: string;
  name: string;
  requiresGuestList: boolean;
}

interface RequestFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: RequestWithRelations | null;
  events: EventWithRelations[];
  packages: PackageWithRelations[];
  userId: string;
  userRole: string;
  onSuccess: () => void;
}

function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || "/uploads";
  return `${baseUrl}/${imagePath}`;
}

export function RequestFormDrawer({
  open,
  onOpenChange,
  request,
  events,
  packages,
  userId,
  userRole,
  onSuccess,
}: RequestFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [availableSectors, setAvailableSectors] = useState<AvailableSector[]>(
    [],
  );
  const [filteredTables, setFilteredTables] = useState<AvailableTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedSector, setSelectedSector] = useState<AvailableSector | null>(
    null,
  );
  const [eventComboboxOpen, setEventComboboxOpen] = useState(false);
  const isEdit = !!request;

  const canManageConsumption = !["USER"].includes(userRole);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      eventId: "",
      sectorId: "",
      tableId: "",
      packageId: "",
      clientName: "",
      clientIdentityCard: "",
      clientPhone: "",
      clientEmail: "",
      clientInstagramHandle: "",
      hasConsumption: false,
      extraGuests: 0,
      guestList: [],
      termsAccepted: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guestList",
  });

  const selectedEventId = form.watch("eventId");
  const selectedSectorId = form.watch("sectorId");

  const loadAvailableTables = useCallback(
    async (eventId: string) => {
      setLoadingTables(true);
      try {
        const result = await getAvailableTablesForEvent(eventId, userId);
        if (result.success && result.data) {
          setAvailableTables(result.data);

          const uniqueSectors = result.data.reduce((acc, table) => {
            if (!acc.find((s) => s.id === table.sectorId)) {
              acc.push({
                id: table.sectorId,
                name: table.sectorName,
                requiresGuestList: table.requiresGuestList,
              });
            }
            return acc;
          }, [] as AvailableSector[]);

          setAvailableSectors(uniqueSectors);
        } else {
          setAvailableTables([]);
          setAvailableSectors([]);
          toast.error(result.error || "Error al cargar mesas disponibles");
        }
      } catch {
        setAvailableTables([]);
        setAvailableSectors([]);
        toast.error("Error al cargar mesas");
      } finally {
        setLoadingTables(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (selectedEventId && !isEdit) {
      loadAvailableTables(selectedEventId);
    }
  }, [selectedEventId, isEdit, loadAvailableTables]);

  useEffect(() => {
    if (selectedSectorId && availableTables.length > 0) {
      const sector = availableSectors.find((s) => s.id === selectedSectorId);
      setSelectedSector(sector || null);

      const tables = availableTables.filter(
        (t) => t.sectorId === selectedSectorId,
      );
      setFilteredTables(tables);
    } else {
      setSelectedSector(null);
      setFilteredTables([]);
    }
  }, [selectedSectorId, availableTables, availableSectors]);

  useEffect(() => {
    if (request) {
      form.reset({
        eventId: request.eventId,
        sectorId: request.table.sectorId,
        tableId: request.tableId,
        packageId: request.packageId,
        clientName: request.client.name,
        clientIdentityCard: request.client.identityCard,
        clientPhone: request.client.phone ?? "",
        clientEmail: request.client.email ?? "",
        clientInstagramHandle: request.client.instagramHandle ?? "",
        hasConsumption: request.hasConsumption,
        extraGuests: request.extraGuests,
        guestList: request.guestInvitations.map((gi) => ({
          name: gi.guest.name,
          identityCard: gi.guest.identityCard,
          phone: gi.guest.phone ?? "",
          email: gi.guest.email ?? "",
          instagramHandle: gi.guest.instagramHandle ?? "",
        })),
        termsAccepted: true,
      });
    } else {
      form.reset({
        eventId: "",
        sectorId: "",
        tableId: "",
        packageId: "",
        clientName: "",
        clientIdentityCard: "",
        clientPhone: "",
        clientEmail: "",
        clientInstagramHandle: "",
        hasConsumption: false,
        extraGuests: 0,
        guestList: [],
        termsAccepted: false,
      });
    }
  }, [request, form]);

  async function onSubmit(values: RequestFormValues) {
    setIsLoading(true);

    try {
      if (isEdit && request) {
        const dto: UpdateRequestDTO = {
          id: request.id,
          clientData: {
            name: values.clientName,
            identityCard: values.clientIdentityCard,
            phone: values.clientPhone,
            email: values.clientEmail,
            instagramHandle: values.clientInstagramHandle,
          },
          guestList: values.guestList,
          hasConsumption: values.hasConsumption,
          extraGuests: values.extraGuests,
        };

        const result = await updateRequest(dto);

        if (result.success) {
          toast.success("Solicitud actualizada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar solicitud");
        }
      } else {
        const dto: CreateRequestDTO = {
          eventId: values.eventId,
          tableId: values.tableId,
          packageId: values.packageId,
          clientData: {
            name: values.clientName,
            identityCard: values.clientIdentityCard,
            phone: values.clientPhone,
            email: values.clientEmail,
            instagramHandle: values.clientInstagramHandle,
          },
          guestList: values.guestList,
          hasConsumption: values.hasConsumption,
          extraGuests: values.extraGuests,
          termsAccepted: values.termsAccepted,
          createdById: userId,
        };

        const result = await createRequest(dto);

        if (result.success) {
          toast.success("Solicitud creada correctamente");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear solicitud");
        }
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  const activeEvents = events.filter(
    (e) => e.isActive && new Date(e.eventDate) > new Date(),
  );
  const activePackages = packages.filter((p) => p.isActive);

  const requiresGuestList = selectedSector?.requiresGuestList ?? false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar solicitud" : "Nueva solicitud"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos de la solicitud"
              : "Completa los datos para crear una nueva solicitud"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Evento</FormLabel>
                      <Popover
                        open={eventComboboxOpen}
                        onOpenChange={setEventComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? activeEvents.find(
                                    (event) => event.id === field.value,
                                  )?.name
                                : "Selecciona un evento"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar evento..." />
                            <CommandList>
                              <CommandEmpty>
                                No se encontraron eventos.
                              </CommandEmpty>
                              <CommandGroup>
                                {activeEvents.map((event) => {
                                  const imageUrl = getImageUrl(event.image);
                                  return (
                                    <CommandItem
                                      key={event.id}
                                      value={`${event.name} ${new Date(event.eventDate).toLocaleDateString("es-BO")}`}
                                      onSelect={() => {
                                        field.onChange(event.id);
                                        form.setValue("sectorId", "");
                                        form.setValue("tableId", "");
                                        setSelectedSector(null);
                                        setEventComboboxOpen(false);
                                      }}
                                      className="flex items-center gap-3 p-2"
                                    >
                                      {imageUrl && (
                                        <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border">
                                          <Image
                                            src={imageUrl}
                                            alt={event.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {event.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(
                                            event.eventDate,
                                          ).toLocaleDateString("es-BO")}
                                        </p>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          event.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedEventId && (
                  <>
                    <FormField
                      control={form.control}
                      name="sectorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("tableId", "");
                            }}
                            defaultValue={field.value}
                            disabled={loadingTables}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    loadingTables
                                      ? "Cargando sectores..."
                                      : availableSectors.length === 0
                                        ? "No hay sectores disponibles"
                                        : "Selecciona un sector"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSectors.map((sector) => (
                                <SelectItem key={sector.id} value={sector.id}>
                                  {sector.name}
                                  {sector.requiresGuestList &&
                                    " (Requiere lista)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecciona el sector para filtrar las mesas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedSectorId && (
                      <FormField
                        control={form.control}
                        name="tableId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mesa</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      filteredTables.length === 0
                                        ? "No hay mesas disponibles en este sector"
                                        : "Selecciona una mesa"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredTables.map((table) => (
                                  <SelectItem key={table.id} value={table.id}>
                                    {table.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {filteredTables.length} mesa(s) disponible(s) en{" "}
                              {selectedSector?.name}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                <FormField
                  control={form.control}
                  name="packageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paquete</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un paquete" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activePackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - {pkg.includedPeople} personas
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Datos del Cliente</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <GuestAutocomplete
                        value={field.value}
                        onValueChange={field.onChange}
                        onGuestSelect={(guest) => {
                          form.setValue("clientName", guest.name);
                          form.setValue(
                            "clientIdentityCard",
                            guest.identityCard,
                          );
                          form.setValue("clientPhone", guest.phone ?? "");
                          form.setValue("clientEmail", guest.email ?? "");
                          form.setValue(
                            "clientInstagramHandle",
                            guest.instagramHandle ?? "",
                          );
                        }}
                        placeholder="Juan Pérez"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientIdentityCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carnet de Identidad</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="71234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="juan@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientInstagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="@juanperez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {requiresGuestList && (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Lista de Invitados</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          name: "",
                          identityCard: "",
                          phone: "",
                          email: "",
                          instagramHandle: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        No hay invitados agregados
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            name: "",
                            identityCard: "",
                            phone: "",
                            email: "",
                            instagramHandle: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar primer invitado
                      </Button>
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4 relative"
                      >
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`guestList.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre completo</FormLabel>
                                <GuestAutocomplete
                                  value={field.value ?? ""}
                                  onValueChange={field.onChange}
                                  onGuestSelect={(guest) => {
                                    form.setValue(
                                      `guestList.${index}.name`,
                                      guest.name,
                                    );
                                    form.setValue(
                                      `guestList.${index}.identityCard`,
                                      guest.identityCard,
                                    );
                                    form.setValue(
                                      `guestList.${index}.phone`,
                                      guest.phone ?? "",
                                    );
                                    form.setValue(
                                      `guestList.${index}.email`,
                                      guest.email ?? "",
                                    );
                                    form.setValue(
                                      `guestList.${index}.instagramHandle`,
                                      guest.instagramHandle ?? "",
                                    );
                                  }}
                                  placeholder="María López"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`guestList.${index}.identityCard`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Carnet de Identidad</FormLabel>
                                <FormControl>
                                  <Input placeholder="7654321" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`guestList.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono (opcional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="71234567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`guestList.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="maria@ejemplo.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`guestList.${index}.instagramHandle`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="@marialopez" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Opciones Adicionales</h3>

              {canManageConsumption && (
                <FormField
                  control={form.control}
                  name="hasConsumption"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>La mesa tendrá consumo</FormLabel>
                        <FormDescription>
                          Marcar si la mesa incluye bebidas o alimentos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="extraGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personas extra</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Número de personas adicionales al paquete
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEdit && (
              <>
                <Separator />

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto los términos y condiciones
                          </FormLabel>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-4 rounded-lg max-h-50 overflow-y-auto">
                        <p className="font-semibold mb-2">
                          Términos y Condiciones
                        </p>
                        <p className="mb-2">
                          Para confirmar su reserva, complete este formulario
                          con todos los datos solicitados. Es obligatorio el
                          llenado de todos los campos.
                        </p>
                        <p className="font-semibold mt-3 mb-1">
                          Puntos Clave a Considerar:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong>Requisito de Edad Mínima:</strong> Solo se
                            aceptan reservas y está permitido el ingreso a
                            mayores de 18 años.
                          </li>
                          <li>
                            <strong>Identificación Obligatoria:</strong> Es
                            indispensable presentar el Carnet de Identidad
                            (C.I.) físico y original al momento del ingreso.
                          </li>
                          <li>
                            <strong>Validez de la Reserva:</strong> Su reserva
                            es válida únicamente hasta las 23:00 horas del día
                            del evento.
                          </li>
                          <li>
                            <strong>Política de Cancelación:</strong> No se
                            realizan devoluciones ni reprogramaciones de mesas
                            bajo ninguna circunstancia.
                          </li>
                        </ul>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
