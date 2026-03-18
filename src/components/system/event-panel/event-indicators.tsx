// src/components/system/event-panel/event-indicators.tsx

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventPanelData } from "@/lib/actions/types/event-panel-types";

interface IndicatorRowProps {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  description: string;
}

function IndicatorRow({
  label,
  value,
  status,
  description,
}: IndicatorRowProps) {
  const config = {
    green: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
      valueClass: "text-green-600 dark:text-green-400",
    },
    yellow: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />,
      valueClass: "text-yellow-600 dark:text-yellow-400",
    },
    red: {
      icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
      valueClass: "text-red-600 dark:text-red-400",
    },
  }[status];

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0">
      {config.icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className={`text-sm font-bold shrink-0 ${config.valueClass}`}>
        {value}
      </span>
    </div>
  );
}

interface EventIndicatorsProps {
  data: EventPanelData;
}

export function EventIndicators({ data }: EventIndicatorsProps) {
  const { kpis, paymentConversionRate, sectorAvailability, overallOccupancy } =
    data;

  const scanRate =
    kpis.totalQRGenerated > 0
      ? Math.round((kpis.totalQRScanned / kpis.totalQRGenerated) * 100)
      : 0;

  const soldOutSectors = sectorAvailability.filter(
    (s) => s.freeTables === 0,
  ).length;
  const lowSectors = sectorAvailability.filter(
    (s) => s.occupancyPercent >= 80 && s.freeTables > 0,
  ).length;

  const occupancyStatus: "green" | "yellow" | "red" =
    overallOccupancy >= 90
      ? "red"
      : overallOccupancy >= 70
        ? "yellow"
        : "green";

  const conversionStatus: "green" | "yellow" | "red" =
    paymentConversionRate >= 80
      ? "green"
      : paymentConversionRate >= 50
        ? "yellow"
        : "red";

  const avgMinutes = kpis.avgApprovalMinutes;
  const approvalStatus: "green" | "yellow" | "red" =
    avgMinutes === null
      ? "green"
      : avgMinutes <= 30
        ? "green"
        : avgMinutes <= 120
          ? "yellow"
          : "red";

  const availabilityStatus: "green" | "yellow" | "red" =
    soldOutSectors === 0 && lowSectors === 0
      ? "green"
      : soldOutSectors === 0
        ? "yellow"
        : "red";

  const scanStatus: "green" | "yellow" | "red" =
    scanRate >= 80 ? "green" : scanRate >= 50 ? "yellow" : "red";

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-semibold">Indicadores</CardTitle>
        <p className="text-xs text-muted-foreground">
          Semáforos de gestión del evento
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <IndicatorRow
          label="Ocupación general"
          value={`${overallOccupancy}%`}
          status={occupancyStatus}
          description="Mesas reservadas sobre el total"
        />
        <IndicatorRow
          label="Escaneo QR"
          value={`${scanRate}%`}
          status={scanStatus}
          description={`${kpis.totalQRScanned} escaneados de ${kpis.totalQRGenerated}`}
        />
        <IndicatorRow
          label="Conversión de pago"
          value={`${paymentConversionRate}%`}
          status={conversionStatus}
          description="Pagados vs aprobados + pre-aprobados"
        />
        <IndicatorRow
          label="Velocidad de aprobación"
          value={
            avgMinutes === null
              ? "—"
              : avgMinutes < 60
                ? `${Math.round(avgMinutes)}m`
                : `${(avgMinutes / 60).toFixed(1)}h`
          }
          status={approvalStatus}
          description="Promedio solicitud → aprobación"
        />
        <IndicatorRow
          label="Alertas de sectores"
          value={
            soldOutSectors > 0
              ? `${soldOutSectors} sold out`
              : lowSectors > 0
                ? `${lowSectors} al límite`
                : "Sin alertas"
          }
          status={availabilityStatus}
          description="Sectores con baja disponibilidad"
        />
      </CardContent>
    </Card>
  );
}
