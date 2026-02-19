// src/components/system/user-activity/user-activity-day-dialog.tsx

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { UserActivityDTO } from "@/lib/actions/types/user-activity-types";
import {
  deleteUserActivity,
  upsertUserActivity,
} from "@/lib/actions/user-activity-actions";

interface UserActivityDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: string;
  existing: UserActivityDTO | null;
  onSaved: (activity: UserActivityDTO) => void;
  onDeleted: (date: string) => void;
}

export function UserActivityDayDialog({
  open,
  onOpenChange,
  userId,
  date,
  existing,
  onSaved,
  onDeleted,
}: UserActivityDayDialogProps) {
  const [hasActivity, setHasActivity] = useState(existing?.hasActivity ?? true);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [loading, setLoading] = useState(false);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  async function handleSave() {
    setLoading(true);
    const result = await upsertUserActivity({
      userId,
      date,
      hasActivity,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (result.success && result.data) {
      toast.success("Actividad guardada");
      onSaved(result.data);
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setLoading(true);
    const result = await deleteUserActivity(userId, date);
    setLoading(false);

    if (result.success) {
      toast.success("Actividad eliminada");
      onDeleted(date);
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{formattedDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-activity">Tuvo actividad</Label>
            <Switch
              id="has-activity"
              checked={hasActivity}
              onCheckedChange={setHasActivity}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas sobre la actividad..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Eliminar
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
