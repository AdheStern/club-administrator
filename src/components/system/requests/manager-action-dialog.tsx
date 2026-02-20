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
  markAsPaid,
  observeRequest,
  preApproveRequest,
  rejectRequest,
} from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import { PaymentVoucherUpload } from "./payment-voucher-upload";

interface BaseDialogProps {
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
}: BaseDialogProps) {
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
    } catch {
      toast.error("Ocurrió un error inesperado");
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

        <RequestSummary request={request} />

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

export function MarkAsPaidDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: Omit<BaseDialogProps, "userId">) {
  const [isLoading, setIsLoading] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(
    request?.paymentVoucherUrl ?? null,
  );

  const handleMarkAsPaid = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      const result = await markAsPaid({
        id: request.id,
        paymentVoucherUrl: voucherUrl ?? undefined,
      });

      if (result.success) {
        toast.success("Solicitud marcada como pagada");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al marcar como pagada");
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar pago</DialogTitle>
          <DialogDescription>
            Adjunte el comprobante de pago y confirme la transacción.
          </DialogDescription>
        </DialogHeader>

        <RequestSummary request={request} />

        <div className="py-2">
          <PaymentVoucherUpload
            requestId={request.id}
            existingVoucherUrl={request.paymentVoucherUrl}
            onUploaded={(url) => setVoucherUrl(url)}
            disabled={request.isPaid}
          />
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
            onClick={handleMarkAsPaid}
            disabled={isLoading || request.isPaid}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {request.isPaid ? "Ya pagado" : "Confirmar Pago"}
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
}: BaseDialogProps) {
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
          triggerDownload(
            result.data.qrPDFContent,
            `QR-${request.event.name}-${request.client.name}.html`,
          );

          if (result.data.freeQRPDFContent) {
            triggerDownload(
              result.data.freeQRPDFContent,
              `QR-${request.event.name}-${request.client.name}-GRATIS.html`,
            );
          }

          toast.success("Códigos QR descargados automáticamente");
        } catch {
          toast.error("Error al descargar los códigos QR");
        }

        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al aprobar solicitud");
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
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

        <RequestSummary request={request} />

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
}: BaseDialogProps) {
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
    } catch {
      toast.error("Ocurrió un error inesperado");
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

        <RequestSummary request={request} />

        <div className="space-y-2">
          <Label htmlFor="observe-notes">Notas para el solicitante *</Label>
          <Textarea
            id="observe-notes"
            placeholder="Ej: Falta documento de identidad del invitado #3..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
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
}: BaseDialogProps) {
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
    } catch {
      toast.error("Ocurrió un error inesperado");
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

        <RequestSummary request={request} />

        <div className="space-y-2">
          <Label htmlFor="reject-notes">Motivo del rechazo *</Label>
          <Textarea
            id="reject-notes"
            placeholder="Ej: Documentos falsificados detectados..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
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

function RequestSummary({ request }: { request: RequestWithRelations }) {
  return (
    <div className="space-y-3 py-2">
      <SummaryRow label="Evento" value={request.event?.name ?? "N/A"} />
      <SummaryRow
        label="Cliente"
        value={`${request.client?.name ?? "N/A"} - CI: ${request.client?.identityCard ?? "N/A"}`}
      />
      <SummaryRow
        label="Solicitante"
        value={`${request.createdBy?.name ?? "Sistema"}${request.createdBy?.phone ? ` - ${request.createdBy.phone}` : ""}`}
      />
      <SummaryRow
        label="Total de personas"
        value={String((request.guestInvitations?.length ?? 0) + 1)}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}:</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function triggerDownload(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
