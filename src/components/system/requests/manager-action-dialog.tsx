// src/components/system/requests/manager-action-dialog.tsx

"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRequest,
  observeRequest,
  rejectRequest,
} from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  userId: string;
  onSuccess: () => void;
}

interface ObserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  userId: string;
  onSuccess: () => void;
}

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  userId: string;
  onSuccess: () => void;
}

export function ApproveDialog({
  open,
  onOpenChange,
  request,
  userId,
  onSuccess,
}: ApproveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      const result = await approveRequest({
        id: request.id,
        approvedById: userId,
      });

      if (result.success && result.data) {
        toast.success("Solicitud aprobada correctamente");

        // Descargar automáticamente el PDF con los QR
        try {
          const blob = new Blob([result.data.qrPDFContent], {
            type: "text/html",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `QR-${request.event.name}-${request.client.name}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Códigos QR descargados automáticamente");
        } catch (downloadError) {
          toast.error("Error al descargar los códigos QR");
          console.error("Download error:", downloadError);
        }

        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al aprobar solicitud");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      console.error("Approve error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Aprobar solicitud?</DialogTitle>
          <DialogDescription>
            Esta acción generará códigos QR para todos los invitados y marcará
            la solicitud como aprobada. Los códigos QR se descargarán
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Evento:</p>
            <p className="text-sm text-muted-foreground">
              {request.event?.name || "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cliente:</p>
            <p className="text-sm text-muted-foreground">
              {request.client?.name || "N/A"} - CI:{" "}
              {request.client?.identityCard || "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Total de personas:</p>
            <p className="text-sm text-muted-foreground">
              {(request.guestInvitations?.length || 0) + 1}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar y Descargar QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ObserveDialog({
  open,
  onOpenChange,
  request,
  userId,
  onSuccess,
}: ObserveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleObserve = async () => {
    if (!request) return;

    if (!notes.trim()) {
      toast.error("Debe ingresar notas para observar la solicitud");
      return;
    }

    setIsLoading(true);
    try {
      const result = await observeRequest({
        id: request.id,
        approvedById: userId,
        managerNotes: notes,
      });

      if (result.success) {
        toast.success("Solicitud observada correctamente");
        onSuccess();
        onOpenChange(false);
        setNotes("");
      } else {
        toast.error(result.error || "Error al observar solicitud");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      console.error("Observe error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setNotes("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Observar solicitud</DialogTitle>
          <DialogDescription>
            Agregue notas para que el solicitante pueda corregir la solicitud.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Evento:</p>
            <p className="text-sm text-muted-foreground">
              {request.event?.name || "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cliente:</p>
            <p className="text-sm text-muted-foreground">
              {request.client?.name || "N/A"} - CI:{" "}
              {request.client?.identityCard || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas para el solicitante *</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Falta documento de identidad del invitado #3..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleObserve} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Observar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({
  open,
  onOpenChange,
  request,
  userId,
  onSuccess,
}: RejectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleReject = async () => {
    if (!request) return;

    if (!notes.trim()) {
      toast.error("Debe ingresar el motivo del rechazo");
      return;
    }

    setIsLoading(true);
    try {
      const result = await rejectRequest({
        id: request.id,
        approvedById: userId,
        managerNotes: notes,
      });

      if (result.success) {
        toast.success("Solicitud rechazada correctamente");
        onSuccess();
        onOpenChange(false);
        setNotes("");
      } else {
        toast.error(result.error || "Error al rechazar solicitud");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      console.error("Reject error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setNotes("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
          <DialogDescription>
            Esta acción es irreversible. El cliente deberá crear una nueva
            solicitud si desea participar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Evento:</p>
            <p className="text-sm text-muted-foreground">
              {request.event?.name || "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cliente:</p>
            <p className="text-sm text-muted-foreground">
              {request.client?.name || "N/A"} - CI:{" "}
              {request.client?.identityCard || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Motivo del rechazo *</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Documentos falsificados detectados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rechazar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
