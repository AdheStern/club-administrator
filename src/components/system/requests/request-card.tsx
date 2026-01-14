// src/components/system/requests/request-card.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MoreVertical,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadRequestQRs } from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: RequestWithRelations;
  onView: (request: RequestWithRelations) => void;
  onEdit?: (request: RequestWithRelations) => void;
  onApprove?: (request: RequestWithRelations) => void;
  onObserve?: (request: RequestWithRelations) => void;
  onReject?: (request: RequestWithRelations) => void;
  canEdit?: boolean;
  canManage?: boolean;
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

const isValidDate = (date: Date | null | undefined): boolean => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

export function RequestCard({
  request,
  onView,
  onEdit,
  onApprove,
  onObserve,
  onReject,
  canEdit = false,
  canManage = false,
}: RequestCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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
    (request.status === "PENDING" || request.status === "OBSERVED");

  const rawEventDate = request.event?.eventDate
    ? new Date(request.event.eventDate)
    : null;
  const eventDate = isValidDate(rawEventDate) ? rawEventDate : null;

  const rawCreatedAt = request.createdAt
    ? new Date(request.createdAt)
    : new Date();
  const createdAt = isValidDate(rawCreatedAt) ? rawCreatedAt : new Date();

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
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg leading-none">
              {request.event?.name || "Evento sin nombre"}
            </h3>
            <Badge
              variant={status.variant as any}
              className={cn("text-xs", status.className)}
            >
              {status.label}
            </Badge>
          </div>
          {eventDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(eventDate, "dd MMM yyyy", {
                  locale: es,
                })}
              </span>
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
            {canBeManaged && (
              <>
                <DropdownMenuSeparator />
                {onApprove && (
                  <DropdownMenuItem
                    onClick={() => onApprove(request)}
                    className="text-green-600 focus:text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </DropdownMenuItem>
                )}
                {onObserve && (
                  <DropdownMenuItem onClick={() => onObserve(request)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Observar
                  </DropdownMenuItem>
                )}
                {onReject && (
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

        {request.status === "APPROVED" && (
          <div className="pt-2 border-t">
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
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>Creado por: {request.createdBy?.name || "Sistema"}</p>
          <p>
            {format(createdAt, "dd/MM/yyyy HH:mm", {
              locale: es,
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
