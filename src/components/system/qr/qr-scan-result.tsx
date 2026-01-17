"use client";

import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface ScanResult {
  success: boolean;
  guest: {
    name: string;
    identityCard: string;
  };
  event: {
    name: string;
    eventDate: Date;
  };
  table: {
    name: string;
    sector: {
      name: string;
    };
  };
  package: {
    name: string;
  };
  scannedBy?: {
    name: string;
  };
  usedAt?: Date;
  errorMessage?: string;
  errorCode?: string;
}

interface QRScanResultProps {
  result: ScanResult;
}

export function QRScanResult({ result }: QRScanResultProps) {
  function getStatusConfig() {
    if (result.success) {
      return {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-500",
        title: "Acceso Permitido",
        titleColor: "text-green-900",
      };
    }

    switch (result.errorCode) {
      case "INVALID_QR":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-500",
          title: "Código No Válido",
          titleColor: "text-red-900",
        };
      case "ALREADY_USED":
        return {
          icon: Clock,
          iconColor: "text-orange-600",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-500",
          title: "Código Ya Utilizado",
          titleColor: "text-orange-900",
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-500",
          title: "Error de Validación",
          titleColor: "text-red-900",
        };
    }
  }

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 border-t-4 ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center gap-3 mb-3">
        <StatusIcon className={`h-8 w-8 ${config.iconColor}`} />
        <h3 className={`text-xl font-bold ${config.titleColor}`}>
          {config.title}
        </h3>
      </div>

      <div className="space-y-2">
        <div>
          <p className={`text-2xl font-bold ${config.titleColor}`}>
            {result.guest.name}
          </p>
          <p className="text-sm text-muted-foreground">
            CI: {result.guest.identityCard}
          </p>
        </div>

        {result.event.name && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Evento</p>
            <p className="font-semibold">{result.event.name}</p>
          </div>
        )}

        {result.table.name && (
          <div className="flex gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Mesa:</span>{" "}
              <span className="font-medium">
                {result.table.sector.name} - {result.table.name}
              </span>
            </div>
          </div>
        )}

        {result.usedAt && (
          <div className="pt-2 border-t bg-orange-50 -mx-4 -mb-4 p-4 mt-3">
            <p className="text-xs font-semibold text-orange-700">
              Escaneado: {new Date(result.usedAt).toLocaleString("es-BO")}
            </p>
            {result.scannedBy && (
              <p className="text-xs text-orange-600">
                Por: {result.scannedBy.name}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
