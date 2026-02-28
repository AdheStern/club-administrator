// src/components/system/requests/export-requests-dialog.tsx
"use client";

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportRequestsToExcel,
  getSectorsForExport,
} from "@/lib/actions/export-actions";
import type { EventWithRelations } from "@/lib/actions/types/event-types";

interface ExportRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventWithRelations[];
}

interface Sector {
  id: string;
  name: string;
}

export function ExportRequestsDialog({
  open,
  onOpenChange,
  events,
}: ExportRequestsDialogProps) {
  const [eventId, setEventId] = useState<string>("all");
  const [sectorId, setSectorId] = useState<string>("all");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoadingSectors(true);
    getSectorsForExport()
      .then((result) => {
        if (result.success && result.data) setSectors(result.data);
      })
      .finally(() => setIsLoadingSectors(false));
  }, [open]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportRequestsToExcel({
        eventId: eventId !== "all" ? eventId : undefined,
        sectorId: sectorId !== "all" ? sectorId : undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Error al exportar");
        return;
      }

      const uint8 = new Uint8Array(result.data.buffer);
      const blob = new Blob([uint8], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Archivo Excel descargado correctamente");
      onOpenChange(false);
    } catch {
      toast.error("Error al generar el archivo");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setEventId("all");
      setSectorId("all");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <DialogTitle>Exportar a Excel</DialogTitle>
              <DialogDescription className="mt-0.5">
                Selecciona los filtros para el reporte
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="export-event">Evento</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger id="export-event">
                <SelectValue placeholder="Todos los eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-sector">Sector</Label>
            <Select
              value={sectorId}
              onValueChange={setSectorId}
              disabled={isLoadingSectors}
            >
              <SelectTrigger id="export-sector">
                <SelectValue
                  placeholder={
                    isLoadingSectors
                      ? "Cargando sectores…"
                      : "Todos los sectores"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sectores</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            El reporte incluye: evento, fecha, cliente, CI, sector, mesa,
            paquete, personas, estado, pago, solicitante y fecha de solicitud.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoadingSectors}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
