// src/lib/actions/event-panel-actions.ts

"use server";

import { db } from "@/lib/db";
import type {
  ActionResult,
  EventOptionDTO,
  EventPanelData,
  QRByPackageDTO,
  RecentRequestDTO,
  SectorActivityDTO,
  SectorAvailabilityDTO,
  SectorRadarDTO,
  TopUserDTO,
} from "./types/event-panel-types";

export async function getEventOptions(): Promise<
  ActionResult<EventOptionDTO[]>
> {
  try {
    const events = await db.event.findMany({
      where: { isActive: true },
      select: { id: true, name: true, eventDate: true },
      orderBy: { eventDate: "desc" },
    });

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        name: e.name,
        eventDate: e.eventDate.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Error al cargar los eventos" };
  }
}

export async function getEventPanelData(
  eventId: string,
): Promise<ActionResult<EventPanelData>> {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, eventDate: true },
    });

    if (!event) {
      return { success: false, error: "Evento no encontrado" };
    }

    const eventRequestIds = await db.request
      .findMany({ where: { eventId }, select: { id: true } })
      .then((r) => r.map((x) => x.id));

    const [
      approvedRequests,
      allQREntries,
      sectorAvailabilityRaw,
      packagesRaw,
      topUsersRaw,
      recentRequestsRaw,
      revenueRaw,
      preApprovedCount,
      paidCount,
      approvedWithTimes,
    ] = await Promise.all([
      db.request.count({
        where: { eventId, status: "APPROVED" },
      }),

      db.qREntry.findMany({
        where: { requestId: { in: eventRequestIds } },
        select: { currentUses: true, requestId: true },
      }),

      db.eventTable.findMany({
        where: { eventId },
        select: {
          tableId: true,
          table: {
            select: {
              sector: { select: { id: true, name: true } },
            },
          },
        },
      }),

      db.package.findMany({
        where: { requests: { some: { eventId } } },
        select: {
          id: true,
          name: true,
          color: true,
          isInvitation: true,
        },
      }),

      db.user.findMany({
        where: {
          requestsCreated: { some: { eventId } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: { requestsCreated: { where: { eventId } } },
          },
        },
        orderBy: { requestsCreated: { _count: "desc" } },
        take: 10,
      }),

      db.request.findMany({
        where: { eventId },
        select: {
          id: true,
          status: true,
          isPaid: true,
          createdAt: true,
          client: { select: { name: true } },
          package: { select: { name: true } },
          table: {
            select: {
              name: true,
              sector: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),

      db.request.findMany({
        where: { eventId, status: "APPROVED" },
        select: {
          extraGuests: true,
          package: {
            select: { basePrice: true, extraPersonPrice: true },
          },
        },
      }),

      db.request.count({
        where: { eventId, status: "PRE_APPROVED" },
      }),

      db.request.count({
        where: { eventId, isPaid: true },
      }),

      db.request.findMany({
        where: { eventId, status: "APPROVED", approvedAt: { not: null } },
        select: { createdAt: true, approvedAt: true },
      }),
    ]);

    const uniqueRequestIds = [...new Set(allQREntries.map((q) => q.requestId))];
    const requestsForQR = await db.request.findMany({
      where: { id: { in: uniqueRequestIds }, eventId },
      select: { id: true, packageId: true, isInvitation: true },
    });
    const requestQRMap = new Map<
      string,
      { id: string; packageId: string; isInvitation: boolean }
    >(requestsForQR.map((r) => [r.id, r]));

    const totalQRGenerated = allQREntries.length;
    const totalQRScanned = allQREntries.filter((q) => q.currentUses > 0).length;
    const totalQRPending = totalQRGenerated - totalQRScanned;

    const invitationQREntries = allQREntries.filter((q) => {
      const req = requestQRMap.get(q.requestId);
      return req?.isInvitation === true;
    });
    const invitationQRGenerated = invitationQREntries.length;
    const invitationQRScanned = invitationQREntries.filter(
      (q) => q.currentUses > 0,
    ).length;
    const invitationQRPending = invitationQRGenerated - invitationQRScanned;

    const regularQREntries = allQREntries.filter((q) => {
      const req = requestQRMap.get(q.requestId);
      return req && !req.isInvitation;
    });
    const regularQRGenerated = regularQREntries.length;
    const regularQRScanned = regularQREntries.filter(
      (q) => q.currentUses > 0,
    ).length;
    const regularQRPending = regularQRGenerated - regularQRScanned;

    const totalRevenue = revenueRaw.reduce((acc, r) => {
      const base = Number(r.package.basePrice);
      const extra =
        r.extraGuests > 0
          ? Number(r.package.extraPersonPrice ?? 0) * r.extraGuests
          : 0;
      return acc + base + extra;
    }, 0);

    const avgApprovalMinutes =
      approvedWithTimes.length > 0
        ? approvedWithTimes.reduce((acc, r) => {
            const approvedAt = r.approvedAt;
            if (!approvedAt) return acc;
            return acc + (approvedAt.getTime() - r.createdAt.getTime()) / 60000;
          }, 0) / approvedWithTimes.length
        : null;

    const bookedTableIds = new Set(
      await db.request
        .findMany({
          where: { eventId, status: "APPROVED" },
          select: { tableId: true },
        })
        .then((rows) => rows.map((r) => r.tableId)),
    );

    const sectorMap = new Map<
      string,
      { name: string; total: number; booked: number }
    >();
    for (const et of sectorAvailabilityRaw) {
      const sid = et.table.sector.id;
      const entry = sectorMap.get(sid) ?? {
        name: et.table.sector.name,
        total: 0,
        booked: 0,
      };
      entry.total++;
      if (bookedTableIds.has(et.tableId)) entry.booked++;
      sectorMap.set(sid, entry);
    }

    const totalTables = Array.from(sectorMap.values()).reduce(
      (a, s) => a + s.total,
      0,
    );
    const bookedTables = Array.from(sectorMap.values()).reduce(
      (a, s) => a + s.booked,
      0,
    );
    const overallOccupancy =
      totalTables > 0 ? Math.round((bookedTables / totalTables) * 100) : 0;

    const sectorAvailability: SectorAvailabilityDTO[] = Array.from(
      sectorMap.entries(),
    ).map(([sectorId, v]) => ({
      sectorId,
      sectorName: v.name,
      totalTables: v.total,
      bookedTables: v.booked,
      freeTables: v.total - v.booked,
      occupancyPercent:
        v.total > 0 ? Math.round((v.booked / v.total) * 100) : 0,
    }));

    const qrByPackage: QRByPackageDTO[] = packagesRaw.map((pkg) => {
      const pkgQREntries = allQREntries.filter((q) => {
        const req = requestQRMap.get(q.requestId);
        return req?.packageId === pkg.id;
      });
      const regularCount = pkgQREntries.filter((q) => {
        const req = requestQRMap.get(q.requestId);
        return req && !req.isInvitation;
      }).length;
      const invitationCount = pkgQREntries.filter((q) => {
        const req = requestQRMap.get(q.requestId);
        return req?.isInvitation === true;
      }).length;
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        packageColor: pkg.color,
        isInvitation: pkg.isInvitation,
        regularCount,
        invitationCount,
      };
    });

    const topUsers: TopUserDTO[] = topUsersRaw.map((u) => ({
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      requestCount: u._count.requestsCreated,
    }));

    const recentRequests: RecentRequestDTO[] = recentRequestsRaw.map((r) => ({
      id: r.id,
      clientName: r.client.name,
      packageName: r.package.name,
      sectorName: r.table.sector.name,
      tableName: r.table.name,
      status: r.status,
      isPaid: r.isPaid,
      createdAt: r.createdAt.toISOString(),
    }));

    const sectorActivityGrouped = await db.request.groupBy({
      by: ["tableId"],
      where: { eventId },
      _count: { id: true },
    });

    const sectorApprovedGrouped = await db.request.groupBy({
      by: ["tableId"],
      where: { eventId, status: "APPROVED" },
      _count: { id: true },
    });

    const tableIdsForActivity = sectorActivityGrouped.map((s) => s.tableId);
    const tablesForActivity = await db.table.findMany({
      where: { id: { in: tableIdsForActivity } },
      select: { id: true, sector: { select: { id: true, name: true } } },
    });

    const tableToSector = new Map(
      tablesForActivity.map((t) => [
        t.id,
        { id: t.sector.id, name: t.sector.name },
      ]),
    );

    const activityBySector = new Map<
      string,
      { name: string; total: number; approved: number }
    >();
    for (const g of sectorActivityGrouped) {
      const sec = tableToSector.get(g.tableId);
      if (!sec) continue;
      const entry = activityBySector.get(sec.id) ?? {
        name: sec.name,
        total: 0,
        approved: 0,
      };
      entry.total += g._count.id;
      activityBySector.set(sec.id, entry);
    }
    for (const g of sectorApprovedGrouped) {
      const sec = tableToSector.get(g.tableId);
      if (!sec) continue;
      const entry = activityBySector.get(sec.id);
      if (entry) entry.approved += g._count.id;
    }

    const sectorActivity: SectorActivityDTO[] = Array.from(
      activityBySector.values(),
    )
      .map((s) => ({ sectorName: s.name, requestCount: s.total }))
      .sort((a, b) => b.requestCount - a.requestCount);

    const maxActivity = Math.max(
      ...Array.from(activityBySector.values()).map((s) => s.total),
      1,
    );
    const sectorRadar: SectorRadarDTO[] = Array.from(
      activityBySector.values(),
    ).map((s) => {
      const sAvail = sectorAvailability.find((sa) => sa.sectorName === s.name);
      return {
        sectorName: s.name.length > 10 ? `${s.name.slice(0, 10)}…` : s.name,
        solicitudes: Math.round((s.total / maxActivity) * 100),
        ocupacion: sAvail?.occupancyPercent ?? 0,
        aprobadas: s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0,
      };
    });

    const totalPotential = approvedRequests + preApprovedCount;
    const paymentConversionRate =
      totalPotential > 0 ? Math.round((paidCount / totalPotential) * 100) : 0;

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          eventDate: event.eventDate.toISOString(),
        },
        kpis: {
          approvedRequests,
          totalQRGenerated,
          totalQRScanned,
          totalQRPending,
          totalRevenue,
          regularQRGenerated,
          regularQRScanned,
          regularQRPending,
          invitationQRGenerated,
          invitationQRScanned,
          invitationQRPending,
          avgApprovalMinutes,
        },
        sectorAvailability,
        qrByPackage,
        topUsers,
        recentRequests,
        sectorActivity,
        sectorRadar,
        paymentConversionRate,
        overallOccupancy,
      },
    };
  } catch (err) {
    console.error("[getEventPanelData]", err);
    return { success: false, error: "Error al cargar el panel del evento" };
  }
}
