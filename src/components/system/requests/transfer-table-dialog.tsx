// src/components/system/requests/transfer-table-dialog.tsx
"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  getAvailableTablesForEvent,
  transferTable,
} from "@/lib/actions/request-actions";
import type { RequestWithRelations } from "@/lib/actions/types/request-types";

interface TransferTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  userId: string;
  onSuccess: () => void;
}

interface AvailableTable {
  id: string;
  name: string;
  sectorId: string;
  sectorName: string;
  requiresGuestList: boolean;
}

export function TransferTableDialog({
  open,
  onOpenChange,
  request,
  userId,
  onSuccess,
}: TransferTableDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);

  const loadAvailableTables = useCallback(
    async (eventId: string) => {
      console.log("Loading tables for event:", eventId, "user:", userId);
      setLoadingTables(true);
      try {
        const result = await getAvailableTablesForEvent(eventId, userId);
        console.log("Tables result:", result);

        if (result.success && result.data) {
          console.log("Setting available tables:", result.data);
          setAvailableTables(result.data);
        } else {
          console.error("Failed to load tables:", result.error);
          setAvailableTables([]);
          toast.error(result.error || "Error al cargar mesas disponibles");
        }
      } catch (error) {
        console.error("Exception loading tables:", error);
        setAvailableTables([]);
        toast.error("Error al cargar mesas");
      } finally {
        setLoadingTables(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (open && request) {
      console.log("Dialog opened with request:", request);
      setSelectedTableId(request.tableId);
      loadAvailableTables(request.eventId);
    } else {
      console.log("Dialog closed or no request");
    }
  }, [open, request, loadAvailableTables]);

  if (!request) return null;

  const currentSectorId = request.table?.sector?.id || "";
  const currentSectorName = request.table?.sector?.name || "N/A";
  const currentTableName = request.table?.name || "N/A";

  console.log("Current sector:", currentSectorId, currentSectorName);
  console.log("Available tables:", availableTables);

  const tablesInSameSector = availableTables.filter(
    (t) => t.sectorId === currentSectorId,
  );

  console.log("Tables in same sector:", tablesInSameSector);

  const handleTransfer = async () => {
    if (!request || !selectedTableId) return;

    if (selectedTableId === request.tableId) {
      toast.error("Debe seleccionar una mesa diferente");
      return;
    }

    setIsLoading(true);
    try {
      const result = await transferTable({
        id: request.id,
        newTableId: selectedTableId,
      });

      if (result.success) {
        toast.success("Mesa transferida correctamente");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al transferir mesa");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      console.error("Transfer error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setSelectedTableId(request.tableId);
          setAvailableTables([]);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Mesa</DialogTitle>
          <DialogDescription>
            Cambia la mesa asignada dentro del mismo sector
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Evento:</p>
            <p className="text-sm text-muted-foreground">
              {request.event?.name || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Cliente:</p>
            <p className="text-sm text-muted-foreground">
              {request.client?.name || "N/A"} - CI:{" "}
              {request.client?.identityCard || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Sector:</p>
            <p className="text-sm text-muted-foreground">{currentSectorName}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Mesa actual:</p>
            <p className="text-sm text-muted-foreground">{currentTableName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table">Nueva mesa *</Label>
            {loadingTables ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando mesas...
                </span>
              </div>
            ) : (
              <>
                <Select
                  value={selectedTableId}
                  onValueChange={setSelectedTableId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="table">
                    <SelectValue
                      placeholder={
                        tablesInSameSector.length === 0
                          ? "No hay mesas disponibles en este sector"
                          : "Selecciona una mesa"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesInSameSector.map((table) => (
                      <SelectItem
                        key={table.id}
                        value={table.id}
                        disabled={table.id === request.tableId}
                      >
                        {table.name}
                        {table.id === request.tableId && " (Actual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tablesInSameSector.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tablesInSameSector.length} mesa(s) disponible(s) en{" "}
                    {currentSectorName}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || loadingTables}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              isLoading ||
              loadingTables ||
              selectedTableId === request.tableId ||
              tablesInSameSector.length === 0
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transferir Mesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
