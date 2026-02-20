// src/components/system/requests/request-card.tsx

"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  MoreVertical,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { downloadRequestQRs, markAsPaid } from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import { cn } from "@/lib/utils";
import { PaymentVoucherUpload } from "./payment-voucher-upload";

interface RequestCardProps {
  request: RequestWithRelations;
  onView: (request: RequestWithRelations) => void;
  onEdit?: (request: RequestWithRelations) => void;
  onApprove?: (request: RequestWithRelations) => void;
  onObserve?: (request: RequestWithRelations) => void;
  onReject?: (request: RequestWithRelations) => void;
  onTransferTable?: (request: RequestWithRelations) => void;
  canEdit?: boolean;
  canManage?: boolean;
  onRefresh?: () => void;
}

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    variant: "default" as const,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  OBSERVED: {
    label: "Observada",
    variant: "outline" as const,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  PRE_APPROVED: {
    label: "Pre-Aprobada",
    variant: "default" as const,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  APPROVED: {
    label: "Aprobada",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    label: "Rechazada",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const isValidDate = (date: Date | null | undefined): boolean =>
  date instanceof Date && !Number.isNaN(date.getTime());

export function RequestCard({
  request,
  onView,
  onEdit,
  onApprove,
  onObserve,
  onReject,
  onTransferTable,
  canEdit = false,
  canManage = false,
  onRefresh,
}: RequestCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [pendingVoucherUrl, setPendingVoucherUrl] = useState<string | null>(
    null,
  );

  const statusKey = request.status as keyof typeof statusConfig;
  const status = statusConfig[statusKey] || {
    label: request.status,
    variant: "secondary",
    className: "",
  };

  const canBeEdited =
    canEdit && (request.status === "PENDING" || request.status === "OBSERVED");
  const canBeManaged =
    canManage &&
    (request.status === "PENDING" ||
      request.status === "OBSERVED" ||
      request.status === "PRE_APPROVED");
  const canTransferTable =
    canManage &&
    (request.status === "PENDING" ||
      request.status === "OBSERVED" ||
      request.status === "PRE_APPROVED");

  const rawEventDate = request.event?.eventDate
    ? new Date(request.event.eventDate)
    : null;
  const eventDate = isValidDate(rawEventDate) ? rawEventDate : null;

  const rawCreatedAt = request.createdAt
    ? new Date(request.createdAt)
    : new Date();
  const createdAt = isValidDate(rawCreatedAt) ? rawCreatedAt : new Date();

  const displayedVoucherUrl = request.paymentVoucherUrl ?? pendingVoucherUrl;

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadRequestQRs(request.id);
      if (result.success && result.data) {
        triggerDownload(
          result.data.qrPDFContent,
          `${result.data.fileName}.html`,
        );
        toast.success("Códigos QR descargados correctamente");
      } else {
        toast.error(result.error || "Error al descargar códigos QR");
      }
    } catch {
      toast.error("Error al descargar códigos QR");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFreeQR = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadRequestQRs(request.id);
      if (result.success && result.data?.freeQRPDFContent) {
        triggerDownload(
          result.data.freeQRPDFContent,
          `${result.data.fileName}-GRATIS.html`,
        );
        toast.success("QR de invitado descargado correctamente");
      } else {
        toast.error("No hay QR de invitado disponible");
      }
    } catch {
      toast.error("Error al descargar QR de invitado");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkAsPaid = async (checked: boolean) => {
    if (!checked) return;

    setIsMarkingPaid(true);
    try {
      const result = await markAsPaid({
        id: request.id,
        paymentVoucherUrl: pendingVoucherUrl ?? undefined,
      });

      if (result.success) {
        toast.success("Solicitud marcada como pagada");
        onRefresh?.();
      } else {
        toast.error(result.error || "Error al marcar como pagada");
      }
    } catch {
      toast.error("Error al marcar como pagada");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg leading-none">
              {request.event?.name || "Evento sin nombre"}
            </h3>
            <Badge
              variant={
                status.variant as
                  | "default"
                  | "outline"
                  | "secondary"
                  | "destructive"
              }
              className={cn("text-xs", status.className)}
            >
              {status.label}
            </Badge>
          </div>
          {eventDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(eventDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(request)}>
              Ver detalles
            </DropdownMenuItem>
            {canBeEdited && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(request)}>
                Editar
              </DropdownMenuItem>
            )}
            {canTransferTable && onTransferTable && (
              <DropdownMenuItem onClick={() => onTransferTable(request)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transferir Mesa
              </DropdownMenuItem>
            )}
            {canBeManaged && (
              <>
                <DropdownMenuSeparator />
                {onApprove &&
                  (request.status === "PENDING" ||
                    request.status === "OBSERVED") && (
                    <DropdownMenuItem
                      onClick={() => onApprove(request)}
                      className="text-green-600 focus:text-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Pre-Aprobar
                    </DropdownMenuItem>
                  )}
                {onApprove && request.status === "PRE_APPROVED" && (
                  <DropdownMenuItem
                    onClick={() => onApprove(request)}
                    disabled={!request.isPaid}
                    className={cn(
                      request.isPaid
                        ? "text-green-600 focus:text-green-600"
                        : "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {request.isPaid
                      ? "Aprobar Final"
                      : "Aprobar (marcar como pagado primero)"}
                  </DropdownMenuItem>
                )}
                {onObserve && request.status === "PENDING" && (
                  <DropdownMenuItem onClick={() => onObserve(request)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Observar
                  </DropdownMenuItem>
                )}
                {onReject &&
                  (request.status === "PENDING" ||
                    request.status === "OBSERVED" ||
                    request.status === "PRE_APPROVED") && (
                    <DropdownMenuItem
                      onClick={() => onReject(request)}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </DropdownMenuItem>
                  )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Sector</p>
            <p className="font-medium">
              {request.table?.sector?.name || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Mesa</p>
            <p className="font-medium">{request.table?.name || "N/A"}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {request.client?.name || "Cliente desconocido"}
              </p>
              <p className="text-xs text-muted-foreground">
                CI: {request.client?.identityCard || "S/N"}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Paquete: {request.package?.name || "Ninguno"}</span>
          <span>
            {(request.guestInvitations?.length || 0) + 1} persona
            {(request.guestInvitations?.length || 0) + 1 !== 1 ? "s" : ""}
          </span>
        </div>

        {request.managerNotes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">
              Notas del manager:
            </p>
            <p className="text-sm">{request.managerNotes}</p>
          </div>
        )}

        {request.status === "PRE_APPROVED" && request.event.paymentQR && (
          <div className="pt-2 border-t space-y-3">
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-blue-900">QR de Pago</p>
              <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                <Image
                  src={`/uploads/${request.event.paymentQR}`}
                  alt="QR de Pago"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            </div>

            {canManage && (
              <div className="space-y-3">
                <PaymentVoucherUpload
                  requestId={request.id}
                  existingVoucherUrl={request.paymentVoucherUrl}
                  onUploaded={(url) => setPendingVoucherUrl(url)}
                  disabled={request.isPaid}
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`paid-${request.id}`}
                    checked={request.isPaid}
                    onCheckedChange={handleMarkAsPaid}
                    disabled={isMarkingPaid || request.isPaid}
                  />
                  <Label
                    htmlFor={`paid-${request.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {request.isPaid
                      ? "✓ Marcado como pagado"
                      : "Marcar como pagado"}
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}

        {request.status === "APPROVED" && (
          <div className="pt-2 border-t space-y-2">
            {displayedVoucherUrl && (
              <VoucherPreview url={displayedVoucherUrl} />
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleDownloadQR}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Descargando..." : "Descargar Códigos QR"}
            </Button>

            {request.event.freeInvitationQRCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                onClick={handleDownloadFreeQR}
                disabled={isDownloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading
                  ? "Descargando..."
                  : `Descargar QR de Invitado (${request.event.freeInvitationQRCount})`}
              </Button>
            )}
          </div>
        )}

        <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
          <p className="font-medium">
            Solicitante: {request.createdBy?.name || "Sistema"}
          </p>
          {request.createdBy?.phone && (
            <p>Teléfono: {request.createdBy.phone}</p>
          )}
          <p>{format(createdAt, "dd/MM/yyyy HH:mm", { locale: es })}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VoucherPreview({ url }: { url: string }) {
  const isPdf = url.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate">Ver voucher de pago (PDF)</span>
      </a>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted border-b">
        Voucher de pago
      </p>
      <div className="relative w-full aspect-[4/3] max-h-48">
        <Image
          src={url}
          alt="Voucher de pago"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
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
