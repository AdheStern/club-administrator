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
  preApproveRequest,
  rejectRequest,
} from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";

interface PreApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  userId: string;
  onSuccess: () => void;
}

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

export function PreApproveDialog({
  open,
  onOpenChange,
  request,
  userId,
  onSuccess,
}: PreApproveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreApprove = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      const result = await preApproveRequest({
        id: request.id,
        approvedById: userId,
      });

      if (result.success) {
        toast.success("Solicitud pre-aprobada. Esperando pago.");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al pre-aprobar solicitud");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      console.error("Pre-approve error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Pre-aprobar solicitud?</DialogTitle>
          <DialogDescription>
            La solicitud será marcada como pre-aprobada y se mostrará el QR de
            pago. Una vez confirmado el pago, podrás aprobar definitivamente la
            solicitud.
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
            <p className="text-sm font-medium">Solicitante:</p>
            <p className="text-sm text-muted-foreground">
              {request.createdBy?.name || "Sistema"}
              {request.createdBy?.phone && ` - ${request.createdBy.phone}`}
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
          <Button onClick={handlePreApprove} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pre-Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

    if (request.status === "PRE_APPROVED" && !request.isPaid) {
      toast.error("Debe marcar como pagada antes de aprobar definitivamente");
      return;
    }

    setIsLoading(true);
    try {
      const result = await approveRequest({
        id: request.id,
        approvedById: userId,
      });

      if (result.success && result.data) {
        toast.success("Solicitud aprobada correctamente");

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

          if (result.data.freeQRPDFContent) {
            const freeBlob = new Blob([result.data.freeQRPDFContent], {
              type: "text/html",
            });
            const freeUrl = URL.createObjectURL(freeBlob);
            const freeLink = document.createElement("a");
            freeLink.href = freeUrl;
            freeLink.download = `QR-${request.event.name}-${request.client.name}-GRATIS.html`;
            document.body.appendChild(freeLink);
            freeLink.click();
            document.body.removeChild(freeLink);
            URL.revokeObjectURL(freeUrl);
          }

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

  const isPreApproved = request.status === "PRE_APPROVED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPreApproved
              ? "¿Aprobar definitivamente?"
              : "¿Aprobar solicitud?"}
          </DialogTitle>
          <DialogDescription>
            {isPreApproved
              ? "Esta acción generará los códigos QR para todos los invitados y finalizará el proceso de aprobación."
              : "Esta acción pre-aprobará la solicitud. Deberás confirmar el pago antes de la aprobación definitiva."}
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
            <p className="text-sm font-medium">Solicitante:</p>
            <p className="text-sm text-muted-foreground">
              {request.createdBy?.name || "Sistema"}
              {request.createdBy?.phone && ` - ${request.createdBy.phone}`}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Total de personas:</p>
            <p className="text-sm text-muted-foreground">
              {(request.guestInvitations?.length || 0) + 1}
            </p>
          </div>
          {isPreApproved && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Estado de pago:</p>
              <p
                className={`text-sm font-semibold ${request.isPaid ? "text-green-600" : "text-red-600"}`}
              >
                {request.isPaid ? "✓ Pagado" : "✗ No pagado"}
              </p>
            </div>
          )}
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
            onClick={handleApprove}
            disabled={isLoading || (isPreApproved && !request.isPaid)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPreApproved ? "Aprobar y Descargar QR" : "Pre-Aprobar"}
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
            <p className="text-sm font-medium">Solicitante:</p>
            <p className="text-sm text-muted-foreground">
              {request.createdBy?.name || "Sistema"}
              {request.createdBy?.phone && ` - ${request.createdBy.phone}`}
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
            <p className="text-sm font-medium">Solicitante:</p>
            <p className="text-sm text-muted-foreground">
              {request.createdBy?.name || "Sistema"}
              {request.createdBy?.phone && ` - ${request.createdBy.phone}`}
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
