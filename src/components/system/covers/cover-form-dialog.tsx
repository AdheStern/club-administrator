// src/components/system/covers/cover-form-dialog.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Loader2, QrCode } from "lucide-react";
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
import { createCover } from "@/lib/actions/cover-actions";

const coverFormSchema = z
  .object({
    cashAmount: z.number().min(0, "No puede ser negativo"),
    qrAmount: z.number().min(0, "No puede ser negativo"),
  })
  .refine((data) => data.cashAmount + data.qrAmount > 0, {
    message: "Debe registrar al menos un monto",
    path: ["cashAmount"],
  });

type CoverFormValues = z.infer<typeof coverFormSchema>;

interface CoverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void;
}

export function CoverFormDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: CoverFormDialogProps) {
  const form = useForm<CoverFormValues>({
    resolver: zodResolver(coverFormSchema),
    defaultValues: { cashAmount: 0, qrAmount: 0 },
  });

  useEffect(() => {
    if (open) form.reset({ cashAmount: 0, qrAmount: 0 });
  }, [open, form]);

  const cashAmount = form.watch("cashAmount");
  const qrAmount = form.watch("qrAmount");
  const total = (cashAmount || 0) + (qrAmount || 0);

  const onSubmit = async (values: CoverFormValues) => {
    const result = await createCover({ eventId, ...values });
    if (!result.success) {
      toast.error(result.error ?? "Error al registrar cover");
      return;
    }
    toast.success("Cover registrado");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar cover</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cashAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Banknote className="h-5 w-5 text-green-500" />
                    Efectivo (Bs.)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      placeholder="0"
                      className="text-2xl h-14 text-center font-bold"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qrAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <QrCode className="h-5 w-5 text-blue-500" />
                    QR (Bs.)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      placeholder="0"
                      className="text-2xl h-14 text-center font-bold"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {total > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold">
                  Bs. {total.toFixed(2)}
                </span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
