"use client";

import type {
  ClubTable,
  EventTableInstance,
  Reservation,
  User,
} from "@prisma/client";
import { AlertCircle, Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateReservationStatus } from "@/lib/actions/reservations.actions";

// Definimos el tipo completo que viene de la base de datos
type ExtendedReservation = Reservation & {
  seller: User;
  approver: User | null;
  tableInstance: EventTableInstance & { table: ClubTable };
};

interface ReservationListProps {
  reservations: ExtendedReservation[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReservationList({
  reservations,
  isLoading,
  onRefresh,
}: ReservationListProps) {
  const handleStatusChange = async (
    id: string,
    status: "APPROVED" | "REJECTED" | "OBSERVED"
  ) => {
    // TODO: Usar ID real del aprobador
    const result = await updateReservationStatus(
      id,
      status,
      "approver-demo-id"
    );

    if (result.success) {
      toast.success(
        `Reserva ${
          status === "APPROVED"
            ? "aprobada"
            : status === "REJECTED"
            ? "rechazada"
            : "observada"
        }`
      );
      onRefresh();
    } else {
      toast.error("Error al actualizar estado");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          icon: Check,
          color: "text-green-600",
          badge: "default" as const,
          label: "Aprobada",
        };
      case "REJECTED":
        return {
          icon: X,
          color: "text-red-600",
          badge: "destructive" as const,
          label: "Rechazada",
        };
      case "OBSERVED":
        return {
          icon: AlertCircle,
          color: "text-amber-600",
          badge: "secondary" as const,
          label: "Observada",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          badge: "outline" as const,
          label: "Pendiente",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 text-muted-foreground animate-pulse">
        Cargando reservas...
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          No hay reservas registradas para este evento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reservations.map((res) => {
        const config = getStatusConfig(res.status);
        const Icon = config.icon;

        const approvalTime = res.respondedAt
          ? Math.round(
              (new Date(res.respondedAt).getTime() -
                new Date(res.createdAt).getTime()) /
                (1000 * 60)
            )
          : null;

        return (
          <Card
            key={res.id}
            className="relative overflow-hidden transition-all hover:shadow-md"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full ${
                res.status === "APPROVED"
                  ? "bg-green-500"
                  : res.status === "REJECTED"
                  ? "bg-red-500"
                  : res.status === "OBSERVED"
                  ? "bg-amber-500"
                  : "bg-gray-300"
              }`}
            />

            <CardHeader className="pb-2 pl-6 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  {res.customerName}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {res.customerDoc}
                </p>
              </div>
              <Badge variant={config.badge} className="flex gap-1 items-center">
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
            </CardHeader>

            <CardContent className="pl-6 space-y-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted-foreground">Mesa:</div>
                <div className="font-semibold text-right">
                  {res.tableInstance.table.name}
                </div>

                <div className="text-muted-foreground">Personas Extra:</div>
                <div className="text-right">{res.extraGuests}</div>

                <div className="text-muted-foreground">Consumo:</div>
                <div className="text-right">
                  {res.hasConsumption ? "Sí" : "No"}
                </div>

                {approvalTime !== null && (
                  <>
                    <div className="text-muted-foreground">Tiempo Rpta:</div>
                    <div className="text-right text-xs font-mono pt-1">
                      {approvalTime} min
                    </div>
                  </>
                )}
              </div>

              {res.status === "PENDING" && (
                <div className="flex gap-2 pt-3 mt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStatusChange(res.id, "APPROVED")}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleStatusChange(res.id, "OBSERVED")}
                  >
                    Obs
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-10 px-0"
                    title="Rechazar"
                    onClick={() => handleStatusChange(res.id, "REJECTED")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
