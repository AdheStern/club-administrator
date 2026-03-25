// src/components/system/guests/guest-form-dialog.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createGuest, updateGuest } from "@/lib/actions/guest-actions";
import type { GuestWithStats } from "@/lib/actions/types/guest-types";

const guestFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  identityCard: z
    .string()
    .min(4, "El CI debe tener al menos 4 caracteres")
    .max(20),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  instagramHandle: z.string().max(50).optional().or(z.literal("")),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: GuestWithStats | null;
  onSuccess: () => void;
}

export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  onSuccess,
}: GuestFormDialogProps) {
  const isEditing = !!guest;

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      identityCard: "",
      phone: "",
      email: "",
      instagramHandle: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        guest
          ? {
              name: guest.name,
              identityCard: guest.identityCard,
              phone: guest.phone ?? "",
              email: guest.email ?? "",
              instagramHandle: guest.instagramHandle ?? "",
            }
          : {
              name: "",
              identityCard: "",
              phone: "",
              email: "",
              instagramHandle: "",
            },
      );
    }
  }, [open, guest, form]);

  const onSubmit = async (values: GuestFormValues) => {
    const result = isEditing
      ? await updateGuest({
          id: guest.id,
          name: values.name,
          identityCard: values.identityCard,
          phone: values.phone || null,
          email: values.email || null,
          instagramHandle: values.instagramHandle || null,
        })
      : await createGuest({
          name: values.name,
          identityCard: values.identityCard,
          phone: values.phone || undefined,
          email: values.email || undefined,
          instagramHandle: values.instagramHandle || undefined,
        });

    if (!result.success) {
      toast.error(result.error ?? "Ocurrió un error");
      return;
    }

    toast.success(isEditing ? "Cliente actualizado" : "Cliente registrado");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="identityCard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula de identidad</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="591 7XXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="correo@ejemplo.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Guardar cambios" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
