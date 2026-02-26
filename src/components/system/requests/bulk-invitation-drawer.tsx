// src/components/system/requests/bulk-invitation-drawer.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createBulkInvitations } from "@/lib/actions/bulk-invitation-actions";
import { getPackagesForSector } from "@/lib/actions/package-actions";
import { getAvailableTablesForEvent } from "@/lib/actions/request-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import { GuestAutocomplete } from "./guest-autocomplete";

const guestSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  identityCard: z.string().min(5, "Mínimo 5 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
});

const invitationItemSchema = z.object({
  sectorId: z.string().min(1, "El sector es requerido"),
  tableId: z.string().min(1, "La mesa es requerida"),
  packageId: z.string().min(1, "El paquete es requerido"),
  extraGuests: z.number().min(0),
  clientName: z.string().min(2, "Mínimo 2 caracteres"),
  clientIdentityCard: z.string().min(5, "Mínimo 5 caracteres"),
  clientPhone: z.string().min(7, "Mínimo 7 dígitos"),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  clientInstagramHandle: z.string().optional(),
  guestList: z.array(guestSchema),
});

const bulkInvitationSchema = z.object({
  eventId: z.string().min(1, "El evento es requerido"),
  invitations: z
    .array(invitationItemSchema)
    .min(1, "Debe agregar al menos una invitación"),
});

type BulkInvitationFormValues = z.infer<typeof bulkInvitationSchema>;

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

interface BulkInvitationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventWithRelations[];
  userId: string;
  onSuccess: () => void;
}

function InvitationCard({
  index,
  control,
  watch,
  setValue,
  remove,
  availableSectors,
  availableTables,
  canRemove,
}: {
  index: number;
  control: ReturnType<typeof useForm<BulkInvitationFormValues>>["control"];
  watch: ReturnType<typeof useForm<BulkInvitationFormValues>>["watch"];
  setValue: ReturnType<typeof useForm<BulkInvitationFormValues>>["setValue"];
  remove: () => void;
  availableSectors: AvailableSector[];
  availableTables: AvailableTable[];
  canRemove: boolean;
}) {
  const [filteredTables, setFilteredTables] = useState<AvailableTable[]>([]);
  const [availablePackages, setAvailablePackages] = useState<
    PackageWithRelations[]
  >([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [requiresGuestList, setRequiresGuestList] = useState(false);

  const {
    fields,
    append,
    remove: removeGuest,
  } = useFieldArray({
    control,
    name: `invitations.${index}.guestList`,
  });

  const sectorId = watch(`invitations.${index}.sectorId`);

  const loadPackages = useCallback(async (sid: string) => {
    setLoadingPackages(true);
    try {
      const result = await getPackagesForSector(sid);
      if (result.success && result.data) {
        setAvailablePackages(result.data);
      } else {
        setAvailablePackages([]);
      }
    } catch {
      setAvailablePackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    if (!sectorId) {
      setFilteredTables([]);
      setAvailablePackages([]);
      setRequiresGuestList(false);
      return;
    }

    const sector = availableSectors.find((s) => s.id === sectorId);
    setRequiresGuestList(sector?.requiresGuestList ?? false);

    const tables = availableTables.filter((t) => t.sectorId === sectorId);
    setFilteredTables(tables);

    setValue(`invitations.${index}.tableId`, "");
    setValue(`invitations.${index}.packageId`, "");

    loadPackages(sectorId);
  }, [
    sectorId,
    availableSectors,
    availableTables,
    index,
    setValue,
    loadPackages,
  ]);

  return (
    <div className="border rounded-lg p-4 space-y-4 relative">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Invitación #{index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={remove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`invitations.${index}.sectorId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sector</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableSectors.length === 0
                          ? "Sin sectores"
                          : "Selecciona sector"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                      {sector.requiresGuestList && " (Requiere lista)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`invitations.${index}.tableId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesa</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!sectorId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !sectorId
                          ? "Selecciona sector primero"
                          : filteredTables.length === 0
                            ? "Sin mesas disponibles"
                            : "Selecciona mesa"
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`invitations.${index}.packageId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paquete</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!sectorId || loadingPackages}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingPackages
                          ? "Cargando..."
                          : !sectorId
                            ? "Selecciona sector primero"
                            : availablePackages.length === 0
                              ? "Sin paquetes"
                              : "Selecciona paquete"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availablePackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.includedPeople} personas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`invitations.${index}.extraGuests`}
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <p className="text-sm font-semibold">Cliente</p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`invitations.${index}.clientName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <GuestAutocomplete
                value={field.value}
                onValueChange={field.onChange}
                onGuestSelect={(guest) => {
                  setValue(`invitations.${index}.clientName`, guest.name);
                  setValue(
                    `invitations.${index}.clientIdentityCard`,
                    guest.identityCard,
                  );
                  setValue(
                    `invitations.${index}.clientPhone`,
                    guest.phone ?? "",
                  );
                  setValue(
                    `invitations.${index}.clientEmail`,
                    guest.email ?? "",
                  );
                  setValue(
                    `invitations.${index}.clientInstagramHandle`,
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
          control={control}
          name={`invitations.${index}.clientIdentityCard`}
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
          control={control}
          name={`invitations.${index}.clientPhone`}
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
          control={control}
          name={`invitations.${index}.clientEmail`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="juan@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={`invitations.${index}.clientInstagramHandle`}
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

      {requiresGuestList && (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Lista de invitados</p>
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
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                Este sector requiere lista de invitados
              </p>
            ) : (
              fields.map((guestField, guestIndex) => (
                <div
                  key={guestField.id}
                  className="border rounded-lg p-3 space-y-3 relative bg-muted/30"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => removeGuest(guestIndex)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={control}
                      name={`invitations.${index}.guestList.${guestIndex}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nombre</FormLabel>
                          <GuestAutocomplete
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            onGuestSelect={(guest) => {
                              setValue(
                                `invitations.${index}.guestList.${guestIndex}.name`,
                                guest.name,
                              );
                              setValue(
                                `invitations.${index}.guestList.${guestIndex}.identityCard`,
                                guest.identityCard,
                              );
                              setValue(
                                `invitations.${index}.guestList.${guestIndex}.phone`,
                                guest.phone ?? "",
                              );
                              setValue(
                                `invitations.${index}.guestList.${guestIndex}.email`,
                                guest.email ?? "",
                              );
                            }}
                            placeholder="María López"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`invitations.${index}.guestList.${guestIndex}.identityCard`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">CI</FormLabel>
                          <FormControl>
                            <Input placeholder="7654321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function BulkInvitationDrawer({
  open,
  onOpenChange,
  events,
  userId,
  onSuccess,
}: BulkInvitationDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [availableSectors, setAvailableSectors] = useState<AvailableSector[]>(
    [],
  );
  const [loadingTables, setLoadingTables] = useState(false);

  const form = useForm<BulkInvitationFormValues>({
    resolver: zodResolver(bulkInvitationSchema),
    defaultValues: {
      eventId: "",
      invitations: [
        {
          sectorId: "",
          tableId: "",
          packageId: "",
          extraGuests: 0,
          clientName: "",
          clientIdentityCard: "",
          clientPhone: "",
          clientEmail: "",
          clientInstagramHandle: "",
          guestList: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "invitations",
  });

  const selectedEventId = form.watch("eventId");

  const loadTables = useCallback(async (eventId: string) => {
    setLoadingTables(true);
    try {
      const result = await getAvailableTablesForEvent(eventId);
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
      }
    } catch {
      setAvailableTables([]);
      setAvailableSectors([]);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTables(selectedEventId);
      form.setValue("invitations", [
        {
          sectorId: "",
          tableId: "",
          packageId: "",
          extraGuests: 0,
          clientName: "",
          clientIdentityCard: "",
          clientPhone: "",
          clientEmail: "",
          clientInstagramHandle: "",
          guestList: [],
        },
      ]);
    }
  }, [selectedEventId, loadTables, form]);

  const handleClose = () => {
    form.reset();
    setAvailableTables([]);
    setAvailableSectors([]);
    onOpenChange(false);
  };

  async function onSubmit(values: BulkInvitationFormValues) {
    setIsLoading(true);
    try {
      const result = await createBulkInvitations({
        eventId: values.eventId,
        createdById: userId,
        invitations: values.invitations.map((inv) => ({
          sectorId: inv.sectorId,
          tableId: inv.tableId,
          packageId: inv.packageId,
          extraGuests: inv.extraGuests,
          clientData: {
            name: inv.clientName,
            identityCard: inv.clientIdentityCard,
            phone: inv.clientPhone,
            email: inv.clientEmail,
            instagramHandle: inv.clientInstagramHandle,
          },
          guestList: inv.guestList,
        })),
      });

      if (!result.success) {
        toast.error(result.error || "Error al crear invitaciones");
        return;
      }

      const { succeeded, failed, errors, qrPDFContents } = result.data;

      if (succeeded > 0) {
        toast.success(
          `${succeeded} invitación${succeeded !== 1 ? "es" : ""} creada${succeeded !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} fallida${failed !== 1 ? "s" : ""}` : ""}`,
        );

        for (const pdfContent of qrPDFContents) {
          const blob = new Blob([pdfContent], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const win = window.open(url, "_blank");
          if (win) {
            win.onload = () => URL.revokeObjectURL(url);
          }
        }

        onSuccess();
        handleClose();
      } else {
        toast.error("No se pudo crear ninguna invitación");
        for (const err of errors) {
          toast.error(err);
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>Crear invitaciones en lote</SheetTitle>
          <SheetDescription>
            Crea múltiples invitaciones a la vez. Cada una se aprobará
            automáticamente y generará sus QRs.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingTables
                              ? "Cargando..."
                              : "Selecciona un evento"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} —{" "}
                          {new Date(event.eventDate).toLocaleDateString(
                            "es-BO",
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedEventId && (
              <>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <InvitationCard
                      key={field.id}
                      index={index}
                      control={form.control}
                      watch={form.watch}
                      setValue={form.setValue}
                      remove={() => remove(index)}
                      availableSectors={availableSectors}
                      availableTables={availableTables}
                      canRemove={fields.length > 1}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    append({
                      sectorId: "",
                      tableId: "",
                      packageId: "",
                      extraGuests: 0,
                      clientName: "",
                      clientIdentityCard: "",
                      clientPhone: "",
                      clientEmail: "",
                      clientInstagramHandle: "",
                      guestList: [],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar invitación
                </Button>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !selectedEventId}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear {fields.length} invitación
                {fields.length !== 1 ? "es" : ""}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
