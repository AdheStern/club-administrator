// src/lib/actions/qr-stats-actions.ts

"use server";

import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

export interface QRStats {
  total: number;
  scanned: number;
  pending: number;
  byEvent: Array<{
    eventId: string;
    eventName: string;
    eventDate: Date;
    total: number;
    scanned: number;
    pending: number;
  }>;
}

class QRStatsRepository {
  async getQRStats(): Promise<QRStats> {
    const [totalEntries, scannedEntries, byEvent] = await Promise.all([
      db.qREntry.count({ where: { isActive: true } }),

      db.qREntry.count({
        where: { isActive: true, currentUses: { gt: 0 } },
      }),

      db.request.findMany({
        where: { status: "APPROVED" },
        select: {
          eventId: true,
          event: {
            select: { id: true, name: true, eventDate: true },
          },
        },
        distinct: ["eventId"],
      }),
    ]);

    const eventIds = byEvent.map((r) => r.eventId);

    const qrByRequest = await db.qREntry.groupBy({
      by: ["requestId"],
      where: { isActive: true },
      _count: { id: true },
      _sum: { currentUses: true },
    });

    const requestEventMap = await db.request.findMany({
      where: { id: { in: qrByRequest.map((q) => q.requestId) } },
      select: { id: true, eventId: true },
    });

    const requestToEvent = new Map(
      requestEventMap.map((r) => [r.id, r.eventId]),
    );

    const eventStatsMap = new Map<string, { total: number; scanned: number }>();

    for (const qr of qrByRequest) {
      const eventId = requestToEvent.get(qr.requestId);
      if (!eventId) continue;

      const current = eventStatsMap.get(eventId) ?? { total: 0, scanned: 0 };
      eventStatsMap.set(eventId, {
        total: current.total + (qr._count.id ?? 0),
        scanned: current.scanned + (qr._sum.currentUses ?? 0),
      });
    }

    const eventDetails = new Map(byEvent.map((r) => [r.eventId, r.event]));

    const allEventIds = Array.from(
      new Set([...eventIds, ...eventStatsMap.keys()]),
    );

    const additionalEvents = await db.event.findMany({
      where: {
        id: {
          in: allEventIds.filter((id) => !eventDetails.has(id)),
        },
      },
      select: { id: true, name: true, eventDate: true },
    });

    for (const ev of additionalEvents) {
      eventDetails.set(ev.id, ev);
    }

    const byEventResult = Array.from(eventStatsMap.entries())
      .map(([eventId, stats]) => {
        const event = eventDetails.get(eventId);
        if (!event) return null;
        return {
          eventId,
          eventName: event.name,
          eventDate: event.eventDate,
          total: stats.total,
          scanned: stats.scanned,
          pending: stats.total - stats.scanned,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort(
        (a, b) =>
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
      );

    return {
      total: totalEntries,
      scanned: scannedEntries,
      pending: totalEntries - scannedEntries,
      byEvent: byEventResult,
    };
  }
}

class QRStatsService {
  private repository = new QRStatsRepository();

  async getQRStats(): Promise<ActionResult<QRStats>> {
    try {
      const stats = await this.repository.getQRStats();
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener estadísticas de QR",
        code: "FETCH_ERROR",
      };
    }
  }
}

const qrStatsService = new QRStatsService();

export async function getQRStats() {
  return qrStatsService.getQRStats();
}
