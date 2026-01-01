"use client";

import type {
  ClubTable,
  Event,
  EventTableInstance,
  Reservation,
  User,
} from "@prisma/client";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEvents } from "@/lib/actions/events.actions";
import {
  getReservationStats,
  getReservationsByEvent,
} from "@/lib/actions/reservations.actions";
import { ReservationForm } from "./reservation-form";
import { ReservationList } from "./reservation-list";

// Tipos auxiliares
type EventWithTables = Event & {
  tables: (EventTableInstance & { table: ClubTable })[];
};
type ExtendedReservation = Reservation & {
  seller: User;
  approver: User | null;
  tableInstance: EventTableInstance & { table: ClubTable };
};

interface ReservationStats {
  total: number;
  pending: number;
  approved: number;
  observed: number;
  rejected: number;
  avgApprovalTime: number;
}

export function ReservationsPage() {
  const [events, setEvents] = useState<EventWithTables[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [reservations, setReservations] = useState<ExtendedReservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Cargar Eventos
  const loadEvents = useCallback(async () => {
    const result = await getEvents();
    if (result.success && result.data) {
      // Forzamos el tipo porque sabemos que incluye tables
      const loadedEvents = result.data as unknown as EventWithTables[];
      setEvents(loadedEvents);

      // Auto-seleccionar el primer evento si no hay uno seleccionado
      if (loadedEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(loadedEvents[0].id);
      }
    }
  }, [selectedEventId]);

  // 2. Cargar Reservas y Stats (Depende de selectedEventId)
  const loadEventData = useCallback(async () => {
    if (!selectedEventId) return;

    setIsLoading(true);
    try {
      const [resData, statsData] = await Promise.all([
        getReservationsByEvent(selectedEventId),
        getReservationStats(selectedEventId),
      ]);

      if (resData.success && resData.data) {
        setReservations(resData.data as ExtendedReservation[]);
      }

      if (statsData.success && statsData.data) {
        setStats(statsData.data as ReservationStats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedEventId]);

  // Efectos
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const currentEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Reservas & Aprobaciones
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestiona el flujo de venta y aprobación de mesas
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2 w-full sm:w-auto"
          disabled={!selectedEventId}
        >
          <Plus className="h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      {/* Selector de Evento */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <span className="font-medium text-sm whitespace-nowrap">
              Evento Activo:
            </span>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full sm:max-w-xs bg-background">
                <SelectValue placeholder="Selecciona un evento..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} (
                    {new Date(event.date).toLocaleDateString("es-ES")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard
            label="Pendientes"
            value={stats.pending}
            variant="warning"
          />
          <StatCard
            label="Aprobadas"
            value={stats.approved}
            variant="success"
          />
          <StatCard label="Observadas" value={stats.observed} variant="info" />
          <StatCard
            label="Tiempo Prom."
            value={`${stats.avgApprovalTime}m`}
            variant="neutral"
          />
        </div>
      )}

      {/* Lista y Formulario */}
      {currentEvent && selectedEventId && (
        <>
          <ReservationList
            reservations={reservations}
            isLoading={isLoading}
            onRefresh={loadEventData}
          />

          {showForm && (
            <ReservationForm
              eventId={selectedEventId}
              event={currentEvent}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                loadEventData(); // Recargar lista y stats
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Componente simple para las stats
function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "warning" | "success" | "info" | "neutral";
}) {
  const styles = {
    default: "bg-card text-card-foreground",
    warning:
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    success:
      "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    neutral: "bg-secondary text-secondary-foreground",
  };

  return (
    <Card className={`border shadow-sm ${styles[variant]}`}>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <span className="text-xs font-medium opacity-80 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-2xl font-bold mt-1">{value}</span>
      </CardContent>
    </Card>
  );
}
