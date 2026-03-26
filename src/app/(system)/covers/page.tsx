// src/app/(system)/covers/page.tsx

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CoverContainer } from "@/components/system/covers/cover-container";
import { getCoverStats, getCovers } from "@/lib/actions/cover-actions";
import { getEvents } from "@/lib/actions/event-actions";
import type { EventWithRelationsDTO } from "@/lib/actions/types/event-types";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Covers | JET CLUB",
};

interface CoversPageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function CoversPage({ searchParams }: CoversPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { eventId } = await searchParams;

  const eventsResult = await getEvents(
    { isActive: true },
    { page: 1, pageSize: 1000 },
  );
  const events =
    eventsResult.success && eventsResult.data
      ? (
          eventsResult.data.data as (EventWithRelationsDTO & {
            hasCover?: boolean;
          })[]
        ).filter((e) => e.hasCover)
      : [];

  const selectedEventId = eventId ?? events[0]?.id;
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Covers</h1>
          <p className="text-muted-foreground mt-1">
            No hay eventos con cover habilitado
          </p>
        </div>
      </div>
    );
  }

  const [coversResult, statsResult] = await Promise.all([
    getCovers({ eventId: selectedEventId }, { page: 1, pageSize: 1000 }),
    getCoverStats(selectedEventId!),
  ]);

  const initialCovers =
    coversResult.success && coversResult.data ? coversResult.data.data : [];
  const initialStats =
    statsResult.success && statsResult.data
      ? statsResult.data
      : { totalCovers: 0, totalCash: 0, totalQR: 0, grandTotal: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Covers</h1>
          <p className="text-muted-foreground mt-1">
            Registro de cobros de cover por evento
          </p>
        </div>

        {events.length > 1 && (
          <form method="GET">
            <select
              name="eventId"
              defaultValue={selectedEventId}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set("eventId", e.target.value);
                window.location.href = url.toString();
              }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </form>
        )}
      </div>

      <CoverContainer
        event={selectedEvent as EventWithRelationsDTO & { hasCover: boolean }}
        initialCovers={initialCovers}
        initialStats={initialStats}
        userRole={session.user.role}
      />
    </div>
  );
}
