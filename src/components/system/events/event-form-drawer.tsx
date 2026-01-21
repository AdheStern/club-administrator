"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
import {
  createEvent,
  updateEvent,
  uploadEventImage,
  uploadPaymentQR,
} from "@/lib/actions/event-actions";
import type {
  CreateEventDTO,
  EventWithRelationsDTO,
  UpdateEventDTO,
} from "@/lib/actions/types/event-types";
import type { SectorWithRelations } from "@/lib/actions/types/sector-types";
import type { TableWithRelations } from "@/lib/actions/types/table-types";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const eventFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  description: z.string().optional(),
  eventDate: z.date({
    message: "La fecha del evento es requerida",
  }),
  image: z.custom<File>().optional(),
  paymentQR: z.custom<File>().optional(),
  commissionAmount: z
    .number()
    .min(0, "La comisión no puede ser negativa")
    .optional(),
  freeInvitationQRCount: z.number().min(0, "Debe ser mayor o igual a 0"),
  visibilityStart: z.date({
    message: "La fecha de inicio de visibilidad es requerida",
  }),
  visibilityEnd: z.date({
    message: "La fecha de fin de visibilidad es requerida",
  }),
  sectorIds: z.array(z.string()).min(1, "Debe seleccionar al menos un sector"),
  tableIds: z.array(z.string()).min(1, "Debe seleccionar al menos una mesa"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithRelationsDTO | null;
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentQRPreview, setPaymentQRPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const paymentQRInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: new Date(),
      commissionAmount: undefined,
      freeInvitationQRCount: 0,
      visibilityStart: new Date(),
      visibilityEnd: new Date(),
      sectorIds: [],
      tableIds: [],
    },
  });

  const selectedSectorIds = form.watch("sectorIds");

  const availableTables = tables.filter((table) =>
    selectedSectorIds.includes(table.sectorId),
  );

  useEffect(() => {
    if (event) {
      form.reset({
        name: event.name,
        description: event.description ?? "",
        eventDate: new Date(event.eventDate),
        commissionAmount: event.commissionAmount ?? undefined,
        freeInvitationQRCount: event.freeInvitationQRCount,
        visibilityStart: new Date(event.visibilityStart),
        visibilityEnd: new Date(event.visibilityEnd),
        sectorIds: event.eventSectors.map((es) => es.sector.id),
        tableIds: event.eventTables.map((et) => et.table.id),
      });

      if (event.image) {
        setImagePreview(`/uploads/${event.image}`);
      }
      if (event.paymentQR) {
        setPaymentQRPreview(`/uploads/${event.paymentQR}`);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        eventDate: new Date(),
        commissionAmount: undefined,
        freeInvitationQRCount: 0,
        visibilityStart: new Date(),
        visibilityEnd: new Date(),
        sectorIds: [],
        tableIds: [],
      });
      setImagePreview(null);
      setPaymentQRPreview(null);
    }
  }, [event, form]);

  useEffect(() => {
    const currentTableIds = form.getValues("tableIds");
    const validTableIds = currentTableIds.filter((tableId) =>
      availableTables.some((t) => t.id === tableId),
    );

    if (validTableIds.length !== currentTableIds.length) {
      form.setValue("tableIds", validTableIds);
    }
  }, [availableTables, form]);

  const handleImageChange = (file: File | undefined) => {
    if (!file) {
      setImagePreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentQRChange = (file: File | undefined) => {
    if (!file) {
      setPaymentQRPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentQRPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectAllSectors = () => {
    const activeSectors = sectors.filter((s) => s.isActive);
    form.setValue(
      "sectorIds",
      activeSectors.map((s) => s.id),
    );
  };

  const handleSelectAllTables = () => {
    form.setValue(
      "tableIds",
      availableTables.map((t) => t.id),
    );
  };

  async function onSubmit(values: EventFormValues) {
    setIsLoading(true);

    try {
      let imagePath: string | undefined;
      let paymentQRPath: string | undefined;

      if (values.image) {
        const imageResult = await uploadEventImage(values.image);
        if (!imageResult.success) {
          toast.error(imageResult.error || "Error al subir imagen");
          return;
        }
        imagePath = imageResult.data;
      }

      if (values.paymentQR) {
        const qrResult = await uploadPaymentQR(values.paymentQR);
        if (!qrResult.success) {
          toast.error(qrResult.error || "Error al subir QR");
          return;
        }
        paymentQRPath = qrResult.data;
      }

      if (isEdit && event) {
        const dto: UpdateEventDTO = {
          id: event.id,
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          image: imagePath,
          paymentQR: paymentQRPath,
          commissionAmount: values.commissionAmount,
          freeInvitationQRCount: values.freeInvitationQRCount,
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
          image: imagePath,
          paymentQR: paymentQRPath,
          commissionAmount: values.commissionAmount,
          freeInvitationQRCount: values.freeInvitationQRCount,
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
    } catch {
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
              name="image"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>Imagen del evento</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          handleImageChange(file);
                        }}
                      />
                      {imagePreview ? (
                        <div className="relative w-full aspect-9/16 rounded-lg overflow-hidden border">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              field.onChange(undefined);
                              setImagePreview(null);
                              if (imageInputRef.current) {
                                imageInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Subir imagen
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Imagen promocional del evento (formato 9:16, máx. 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentQR"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>QR de pago (opcional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        ref={paymentQRInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          handlePaymentQRChange(file);
                        }}
                      />
                      {paymentQRPreview ? (
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border mx-auto">
                          <Image
                            src={paymentQRPreview}
                            alt="QR Preview"
                            fill
                            className="object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              field.onChange(undefined);
                              setPaymentQRPreview(null);
                              if (paymentQRInputRef.current) {
                                paymentQRInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => paymentQRInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Subir QR de pago
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Código QR para pagos del evento (máx. 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commissionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comisión (Bs.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? Number(value) : undefined);
                        }}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freeInvitationQRCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR gratis por reserva</FormLabel>
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
                            !field.value && "text-muted-foreground",
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
                              !field.value && "text-muted-foreground",
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
                              !field.value && "text-muted-foreground",
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
                  <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 max-h-50 overflow-y-auto">
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
                                            (value) => value !== sector.id,
                                          ),
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
                    <div className="border rounded-lg p-4 max-h-75 overflow-y-auto">
                      {activeSectors
                        .filter((sector) =>
                          selectedSectorIds.includes(sector.id),
                        )
                        .map((sector) => {
                          const sectorTables = availableTables.filter(
                            (t) => t.sectorId === sector.id,
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
                                                table.id,
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
                                                          value !== table.id,
                                                      ),
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
