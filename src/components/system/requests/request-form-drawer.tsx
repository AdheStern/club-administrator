// src/components/system/requests/request-form-drawer.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
import { createRequest, updateRequest } from "@/lib/actions/request-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";
import type { PackageWithRelations } from "@/lib/actions/types/package-types";
import type {
  CreateRequestDTO,
  RequestWithRelations,
  UpdateRequestDTO,
} from "@/lib/actions/types/request-types";

const guestSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  identityCard: z.string().min(5, "El CI debe tener al menos 5 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const requestFormSchema = z.object({
  eventId: z.string().min(1, "El evento es requerido"),
  tableId: z.string().min(1, "La mesa es requerida"),
  packageId: z.string().min(1, "El paquete es requerido"),
  clientName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  clientIdentityCard: z
    .string()
    .min(5, "El CI debe tener al menos 5 caracteres"),
  clientPhone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  hasConsumption: z.boolean().default(false),
  extraGuests: z.number().min(0, "No puede ser negativo").default(0),
  guestList: z.array(guestSchema).min(1, "Debe agregar al menos un invitado"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: RequestWithRelations | null;
  events: EventWithRelations[];
  packages: PackageWithRelations[];
  userId: string;
  onSuccess: () => void;
}

export function RequestFormDrawer({
  open,
  onOpenChange,
  request,
  events,
  packages,
  userId,
  onSuccess,
}: RequestFormDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!request;

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      eventId: "",
      tableId: "",
      packageId: "",
      clientName: "",
      clientIdentityCard: "",
      clientPhone: "",
      clientEmail: "",
      hasConsumption: false,
      extraGuests: 0,
      guestList: [{ name: "", identityCard: "", phone: "", email: "" }],
      termsAccepted: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guestList",
  });

  const selectedEventId = form.watch("eventId");
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const availableTables =
    selectedEvent?.eventTables.filter((et) => !et.isBooked) ?? [];

  useEffect(() => {
    if (request) {
      form.reset({
        eventId: request.eventId,
        tableId: request.tableId,
        packageId: request.packageId,
        clientName: request.client.name,
        clientIdentityCard: request.client.identityCard,
        clientPhone: request.client.phone ?? "",
        clientEmail: request.client.email ?? "",
        hasConsumption: request.hasConsumption,
        extraGuests: request.extraGuests,
        guestList: request.guestInvitations.map((gi) => ({
          name: gi.guest.name,
          identityCard: gi.guest.identityCard,
          phone: "",
          email: "",
        })),
        termsAccepted: true,
      });
    } else {
      form.reset({
        eventId: "",
        tableId: "",
        packageId: "",
        clientName: "",
        clientIdentityCard: "",
        clientPhone: "",
        clientEmail: "",
        hasConsumption: false,
        extraGuests: 0,
        guestList: [{ name: "", identityCard: "", phone: "", email: "" }],
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
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  const activeEvents = events.filter(
    (e) => e.isActive && new Date(e.eventDate) > new Date()
  );
  const activePackages = packages.filter((p) => p.isActive);

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
                    <FormItem>
                      <FormLabel>Evento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un evento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name} -{" "}
                              {new Date(event.eventDate).toLocaleDateString(
                                "es-BO"
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedEvent && (
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
                              <SelectValue placeholder="Selecciona una mesa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTables.map((et) => (
                              <SelectItem key={et.table.id} value={et.table.id}>
                                {et.table.sector.name} - {et.table.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Solo se muestran mesas disponibles
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
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
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Lista de Invitados</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ name: "", identityCard: "", phone: "", email: "" })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {fields.map((field, index) => (
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
                          <FormControl>
                            <Input placeholder="María López" {...field} />
                          </FormControl>
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
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Opciones Adicionales</h3>

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
                      <div className="text-xs text-muted-foreground bg-muted p-4 rounded-lg max-h-[200px] overflow-y-auto">
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
