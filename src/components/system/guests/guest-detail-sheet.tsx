// src/components/system/guests/guest-detail-sheet.tsx

"use client";

import { CalendarDays, Mail, Phone, QrCode, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { GuestWithStats } from "@/lib/actions/types/guest-types";

interface GuestDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestWithStats | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  className,
}: {
  icon: React.ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className={className}>{value}</span>
    </div>
  );
}

export function GuestDetailSheet({
  open,
  onOpenChange,
  guest,
}: GuestDetailSheetProps) {
  if (!guest) return null;

  const hasContact = guest.phone || guest.email || guest.instagramHandle;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            {guest.name}
          </SheetTitle>
          <p className="text-sm text-muted-foreground font-mono">
            {guest.identityCard}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Star className="h-4 w-4" />}
              label="Puntos de lealtad"
              value={guest.loyaltyPoints}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Eventos asistidos"
              value={guest.eventsAttended}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Reservas totales"
              value={guest._count.requestsAsClient}
            />
            <StatCard
              icon={<QrCode className="h-4 w-4" />}
              label="QRs generados"
              value={guest._count.qrEntries}
            />
          </div>

          {hasContact && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Contacto
                </p>
                <div className="space-y-2">
                  {guest.phone && (
                    <ContactRow
                      icon={<Phone className="h-3.5 w-3.5" />}
                      value={guest.phone}
                    />
                  )}
                  {guest.email && (
                    <ContactRow
                      icon={<Mail className="h-3.5 w-3.5" />}
                      value={guest.email}
                    />
                  )}
                  {guest.instagramHandle && (
                    <ContactRow
                      icon={<span className="text-xs font-bold">@</span>}
                      value={`@${guest.instagramHandle}`}
                      className="text-pink-400"
                    />
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Información del registro
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registrado</span>
                <span>
                  {new Date(guest.createdAt).toLocaleDateString("es-BO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Última actualización
                </span>
                <span>
                  {new Date(guest.updatedAt).toLocaleDateString("es-BO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {guest._count.requestsAsClient > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Estado del cliente
                </p>
                <Badge variant="secondary" className="text-xs">
                  Cliente con historial activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Este cliente tiene {guest._count.requestsAsClient} reserva(s)
                  registrada(s) en el sistema.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
