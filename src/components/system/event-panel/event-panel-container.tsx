// src/components/system/event-panel/event-panel-container.tsx

"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { getEventPanelData } from "@/lib/actions/event-panel-actions";
import type {
  EventOptionDTO,
  EventPanelData,
} from "@/lib/actions/types/event-panel-types";
import { EventIndicators } from "./event-indicators";
import { EventSelector } from "./event-selector";
import { KpiRow } from "./kpi-row";
import { QRBreakdownChart } from "./qr-breakdown-chart";
import { QRStackedCard } from "./qr-stacked-card";
import { RecentRequestsList } from "./recent-requests-list";
import { SectorActivityChart } from "./sector-activity-chart";
import { SectorAvailability } from "./sector-availability";
import { TopUsersList } from "./top-users-list";

interface EventPanelContainerProps {
  events: EventOptionDTO[];
}

export function EventPanelContainer({ events }: EventPanelContainerProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<EventPanelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setError(null);
    startTransition(async () => {
      const result = await getEventPanelData(eventId);
      if (result.success && result.data) {
        setPanelData(result.data);
      } else {
        setError(result.error ?? "Error desconocido");
        setPanelData(null);
      }
    });
  }, []);

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Panel de Evento</h1>
            {panelData && (
              <p className="text-xs text-muted-foreground">
                {panelData.event.name} ·{" "}
                {format(
                  new Date(panelData.event.eventDate),
                  "dd 'de' MMMM yyyy",
                  { locale: es },
                )}
              </p>
            )}
          </div>
        </div>
        <EventSelector
          events={events}
          selectedEventId={selectedEventId}
          onSelect={handleEventSelect}
        />
      </div>

      {!selectedEventId && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <LayoutDashboard className="h-10 w-10 mx-auto opacity-20" />
            <p className="text-sm">Selecciona un evento para ver el panel</p>
          </div>
        </div>
      )}

      {selectedEventId && isPending && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedEventId && !isPending && error && (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {panelData && !isPending && (
        <div className="space-y-3">
          {/* Fila 1: 4 KPIs radiales grandes */}
          <KpiRow
            kpis={panelData.kpis}
            paymentConversionRate={panelData.paymentConversionRate}
            overallOccupancy={panelData.overallOccupancy}
          />

          {/* Fila 2: QR Regulares | QR Invitación — grandes, su propia fila */}
          <div className="grid grid-cols-2 gap-3">
            <QRStackedCard
              title="QR Regulares"
              total={panelData.kpis.regularQRGenerated}
              scanned={panelData.kpis.regularQRScanned}
              pending={panelData.kpis.regularQRPending}
              colorScanned="chart-1"
              colorPending="chart-4"
            />
            <QRStackedCard
              title="QR Invitación"
              total={panelData.kpis.invitationQRGenerated}
              scanned={panelData.kpis.invitationQRScanned}
              pending={panelData.kpis.invitationQRPending}
              colorScanned="chart-2"
              colorPending="chart-5"
            />
          </div>

          {/* Fila 3: Actividad vs Ocupación — fila completa */}
          <SectorActivityChart
            data={panelData.sectorActivity ?? []}
            sectorAvailability={panelData.sectorAvailability ?? []}
          />

          {/* Fila 4: Disponibilidad por sector | Indicadores */}
          <div className="grid grid-cols-2 gap-3">
            <SectorAvailability sectors={panelData.sectorAvailability ?? []} />
            <EventIndicators data={panelData} />
          </div>

          {/* Fila 5: Últimas solicitudes | Top usuarios */}
          <div className="grid grid-cols-2 gap-3">
            <RecentRequestsList requests={panelData.recentRequests ?? []} />
            <TopUsersList users={panelData.topUsers ?? []} />
          </div>

          {/* Fila 6: QR por paquete — fila completa al final */}
          <QRBreakdownChart data={panelData.qrByPackage ?? []} />
        </div>
      )}
    </div>
  );
}
