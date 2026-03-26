// src/components/system/covers/cover-container.tsx

"use client";

import { Banknote, Plus, QrCode, Receipt } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/administration/shared/confirmation-dialog";
import { DataTable } from "@/components/administration/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteCover, getCovers } from "@/lib/actions/cover-actions";
import type { CoverDTO, CoverStats } from "@/lib/actions/types/cover-types";
import type { EventWithRelationsDTO } from "@/lib/actions/types/event-types";
import { CoverFormDialog } from "./cover-form-dialog";
import { createCoverColumns } from "./cover-table-columns";

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 flex-1">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

interface CoverContainerProps {
  event: EventWithRelationsDTO & { hasCover: boolean };
  initialCovers: CoverDTO[];
  initialStats: CoverStats;
  userRole: string;
}

export function CoverContainer({
  event,
  initialCovers,
  initialStats,
  userRole,
}: CoverContainerProps) {
  const [covers, setCovers] = useState<CoverDTO[]>(initialCovers);
  const [stats, setStats] = useState<CoverStats>(initialStats);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [coverToDelete, setCoverToDelete] = useState<CoverDTO | null>(null);

  const refresh = useCallback(async () => {
    const [coversResult] = await Promise.all([
      getCovers({ eventId: event.id }, { page: 1, pageSize: 1000 }),
    ]);

    if (coversResult.success && coversResult.data) {
      const data = coversResult.data.data;
      setCovers(data);
      setStats({
        totalCovers: data.length,
        totalCash: data.reduce((acc, c) => acc + c.cashAmount, 0),
        totalQR: data.reduce((acc, c) => acc + c.qrAmount, 0),
        grandTotal: data.reduce((acc, c) => acc + c.total, 0),
      });
    }
  }, [event.id]);

  const handleDelete = useCallback((cover: CoverDTO) => {
    setCoverToDelete(cover);
    setIsDeleteOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!coverToDelete) return;
    const result = await deleteCover(coverToDelete.id);
    if (result.success) {
      toast.success("Cover eliminado");
      refresh();
    } else toast.error(result.error ?? "Error al eliminar");
    setIsDeleteOpen(false);
    setCoverToDelete(null);
  };

  const columns = createCoverColumns(handleDelete, userRole);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <StatPill
            icon={<Receipt className="h-4 w-4" />}
            label="Covers vendidos"
            value={String(stats.totalCovers)}
          />
          <StatPill
            icon={<Banknote className="h-4 w-4 text-green-500" />}
            label="Total efectivo"
            value={`Bs. ${stats.totalCash.toFixed(2)}`}
          />
          <StatPill
            icon={<QrCode className="h-4 w-4 text-blue-500" />}
            label="Total QR"
            value={`Bs. ${stats.totalQR.toFixed(2)}`}
          />
          <StatPill
            icon={<Receipt className="h-4 w-4 text-primary" />}
            label="Gran total"
            value={`Bs. ${stats.grandTotal.toFixed(2)}`}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registro de covers</CardTitle>
              <Button onClick={() => setIsFormOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo cover
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={covers} defaultPageSize={25} />
          </CardContent>
        </Card>
      </div>

      <CoverFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={event.id}
        onSuccess={() => {
          setIsFormOpen(false);
          refresh();
        }}
      />

      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar cover?"
        description={`¿Eliminar el cover de Bs. ${coverToDelete?.total.toFixed(2)}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}
