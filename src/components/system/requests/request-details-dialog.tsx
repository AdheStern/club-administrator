// src/components/system/requests/request-details-dialog.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MapPin,
  Package,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { downloadRequestQRs } from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import { cn } from "@/lib/utils";

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
}

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  OBSERVED: {
    label: "Observada",
    icon: Clock,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  APPROVED: {
    label: "Aprobada",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    label: "Rechazada",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const isValidDate = (date: Date | null | undefined): boolean => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

export function RequestDetailsDialog({
  open,
  onOpenChange,
  request,
}: RequestDetailsDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!request) return null;

  const statusKey = request.status as keyof typeof statusConfig;
  const status = statusConfig[statusKey] || {
    label: request.status,
    icon: Clock,
    className: "",
  };
  const StatusIcon = status.icon;

  const rawEventDate = request.event?.eventDate
    ? new Date(request.event.eventDate)
    : null;
  const eventDate = isValidDate(rawEventDate) ? rawEventDate : null;

  const rawCreatedAt = request.createdAt ? new Date(request.createdAt) : null;
  const createdAt = isValidDate(rawCreatedAt) ? rawCreatedAt : new Date();

  const rawApprovedAt = request.approvedAt
    ? new Date(request.approvedAt)
    : null;
  const approvedAt = isValidDate(rawApprovedAt) ? rawApprovedAt : null;

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  const totalPrice =
    Number(request.package?.basePrice || 0) +
    (request.extraGuests && request.package?.extraPersonPrice
      ? request.extraGuests * Number(request.package.extraPersonPrice)
      : 0);

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadRequestQRs(request.id);

      if (result.success && result.data) {
        const blob = new Blob([result.data.qrPDFContent], {
          type: "text/html",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${result.data.fileName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Códigos QR descargados correctamente");
      } else {
        toast.error(result.error || "Error al descargar códigos QR");
      }
    } catch (error) {
      toast.error("Error al descargar códigos QR");
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Detalles de Solicitud</span>
            <Badge
              variant="outline"
              className={cn("text-xs", status.className)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Solicitud creada el{" "}
            {format(createdAt, "dd 'de' MMMM, yyyy 'a las' HH:mm", {
              locale: es,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Botón de descarga para solicitudes aprobadas */}
          {request.status === "APPROVED" && (
            <Button
              variant="default"
              className="w-full"
              onClick={handleDownloadQR}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Descargando..." : "Descargar Códigos QR"}
            </Button>
          )}

          {/* Información del Evento */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Evento
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="font-semibold text-lg">
                {request.event?.name || "Evento sin nombre"}
              </p>
              {eventDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(eventDate, "EEEE, dd 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información de Mesa */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Sector</p>
                <p className="font-semibold">
                  {request.table?.sector?.name || "N/A"}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Mesa</p>
                <p className="font-semibold">{request.table?.name || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del Paquete */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Paquete
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {request.package?.name || "Sin paquete"}
                </p>
                {request.package?.basePrice && (
                  <p className="font-semibold text-lg">
                    {formatPrice(request.package.basePrice)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Personas incluidas</p>
                  <p className="font-medium">
                    {request.package?.includedPeople || 0}
                  </p>
                </div>
                {request.extraGuests > 0 &&
                  request.package?.extraPersonPrice && (
                    <div>
                      <p className="text-muted-foreground">Personas extra</p>
                      <p className="font-medium">
                        {request.extraGuests} x{" "}
                        {formatPrice(request.package.extraPersonPrice)}
                      </p>
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={request.hasConsumption ? "default" : "secondary"}
                >
                  {request.hasConsumption ? "Con consumo" : "Sin consumo"}
                </Badge>
              </div>
              {request.extraGuests > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatPrice(totalPrice)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del Cliente */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Cliente
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                  <p className="font-medium">
                    {request.client?.name || "Cliente desconocido"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CI</p>
                  <p className="font-medium">
                    {request.client?.identityCard || "S/N"}
                  </p>
                </div>
              </div>
              {request.client?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                  <p className="font-medium">{request.client.phone}</p>
                </div>
              )}
              {request.client?.email && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{request.client.email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Lista de Invitados */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Lista de Invitados ({request.guestInvitations?.length || 0})
            </h3>
            {request.guestInvitations && request.guestInvitations.length > 0 ? (
              <div className="space-y-2">
                {request.guestInvitations.map((invitation, index) => (
                  <div key={invitation.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {invitation.guest?.name || "Invitado desconocido"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CI: {invitation.guest?.identityCard || "S/N"}
                        </p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay invitados registrados
              </p>
            )}
          </div>

          {/* Notas del Manager */}
          {request.managerNotes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Notas del Manager</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm">{request.managerNotes}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Información de Gestión */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Creado por</p>
              <p className="font-medium">
                {request.createdBy?.name || "Sistema"}
              </p>
            </div>
            {request.approvedBy && (
              <div>
                <p className="text-muted-foreground mb-1">Gestionado por</p>
                <p className="font-medium">{request.approvedBy.name}</p>
              </div>
            )}
            {approvedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Fecha de gestión</p>
                <p className="font-medium">
                  {format(approvedAt, "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
            )}
            {request.reviewDuration !== null &&
              request.reviewDuration !== undefined && (
                <div>
                  <p className="text-muted-foreground mb-1">
                    Tiempo de revisión
                  </p>
                  <p className="font-medium">
                    {Math.floor(request.reviewDuration / 60)} min{" "}
                    {request.reviewDuration % 60} seg
                  </p>
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
