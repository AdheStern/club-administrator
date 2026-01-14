// src/lib/actions/dashboard-actions.ts

"use server";

import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  observedRequests: number;
  totalEvents: number;
  upcomingEvents: number;
  totalClients: number;
  totalRevenue: number;
  averageApprovalTime: number;
}

export interface RequestsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface RequestsByMonth {
  month: string;
  count: number;
  approved: number;
  rejected: number;
}

export interface TopClient {
  id: string;
  name: string;
  identityCard: string;
  requestCount: number;
  eventsAttended: number;
  loyaltyPoints: number;
}

export interface UpcomingEvent {
  id: string;
  name: string;
  eventDate: Date;
  image: string | null;
  requestCount: number;
  approvedCount: number;
  pendingCount: number;
}

export interface PendingRequest {
  id: string;
  createdAt: Date;
  client: {
    name: string;
    identityCard: string;
  };
  event: {
    name: string;
    eventDate: Date;
  };
  status: string;
  waitingTime: number;
}

class DashboardRepository {
  async getGeneralStats(): Promise<DashboardStats> {
    const now = new Date();

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      observedRequests,
      totalEvents,
      upcomingEvents,
      totalClients,
      approvedRequestsWithPackages,
    ] = await Promise.all([
      db.request.count(),
      db.request.count({ where: { status: "PENDING" } }),
      db.request.count({ where: { status: "APPROVED" } }),
      db.request.count({ where: { status: "REJECTED" } }),
      db.request.count({ where: { status: "OBSERVED" } }),
      db.event.count(),
      db.event.count({
        where: {
          eventDate: {
            gte: now,
          },
        },
      }),
      db.guest.count(),
      db.request.findMany({
        where: {
          status: "APPROVED",
          reviewDuration: { not: null },
        },
        select: {
          reviewDuration: true,
          package: {
            select: {
              basePrice: true,
              extraPersonPrice: true,
            },
          },
          extraGuests: true,
        },
      }),
    ]);

    const totalRevenue = approvedRequestsWithPackages.reduce((sum, request) => {
      const basePrice = Number(request.package.basePrice);
      const extraPrice = request.extraGuests
        ? request.extraGuests * Number(request.package.extraPersonPrice || 0)
        : 0;
      return sum + basePrice + extraPrice;
    }, 0);

    const approvalTimes = approvedRequestsWithPackages
      .map((r) => r.reviewDuration)
      .filter((t): t is number => t !== null);

    const averageApprovalTime =
      approvalTimes.length > 0
        ? approvalTimes.reduce((sum, time) => sum + time, 0) /
          approvalTimes.length
        : 0;

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      observedRequests,
      totalEvents,
      upcomingEvents,
      totalClients,
      totalRevenue,
      averageApprovalTime,
    };
  }

  async getRequestsByStatus(): Promise<RequestsByStatus[]> {
    const requests = await db.request.groupBy({
      by: ["status"],
      _count: true,
    });

    const total = requests.reduce((sum, item) => sum + item._count, 0);

    return requests.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
    }));
  }

  async getRequestsByMonth(months: number = 6): Promise<RequestsByMonth[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - months);

    const requests = await db.request.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const monthsMap = new Map<string, RequestsByMonth>();

    for (let i = 0; i < months; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthKey = date.toLocaleDateString("es-BO", {
        year: "numeric",
        month: "short",
      });
      monthsMap.set(monthKey, {
        month: monthKey,
        count: 0,
        approved: 0,
        rejected: 0,
      });
    }

    requests.forEach((request) => {
      const monthKey = new Date(request.createdAt).toLocaleDateString("es-BO", {
        year: "numeric",
        month: "short",
      });

      const monthData = monthsMap.get(monthKey);
      if (monthData) {
        monthData.count++;
        if (request.status === "APPROVED") monthData.approved++;
        if (request.status === "REJECTED") monthData.rejected++;
      }
    });

    return Array.from(monthsMap.values()).reverse();
  }

  async getTopClients(limit: number = 5): Promise<TopClient[]> {
    const clients = await db.guest.findMany({
      orderBy: [{ eventsAttended: "desc" }, { loyaltyPoints: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        identityCard: true,
        eventsAttended: true,
        loyaltyPoints: true,
        _count: {
          select: {
            requestsAsClient: true, // ✅ Cambio aquí
          },
        },
      },
    });

    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      identityCard: client.identityCard,
      requestCount: client._count.requestsAsClient, // ✅ Y aquí
      eventsAttended: client.eventsAttended,
      loyaltyPoints: client.loyaltyPoints,
    }));
  }

  async getUpcomingEvents(limit: number = 5): Promise<UpcomingEvent[]> {
    const now = new Date();

    const events = await db.event.findMany({
      where: {
        eventDate: {
          gte: now,
        },
      },
      orderBy: {
        eventDate: "asc",
      },
      take: limit,
      select: {
        id: true,
        name: true,
        eventDate: true,
        image: true,
        requests: {
          select: {
            status: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      eventDate: event.eventDate,
      image: event.image,
      requestCount: event.requests.length,
      approvedCount: event.requests.filter((r) => r.status === "APPROVED")
        .length,
      pendingCount: event.requests.filter(
        (r) => r.status === "PENDING" || r.status === "OBSERVED"
      ).length,
    }));
  }

  async getPendingRequests(limit: number = 10): Promise<PendingRequest[]> {
    const requests = await db.request.findMany({
      where: {
        OR: [{ status: "PENDING" }, { status: "OBSERVED" }],
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        status: true,
        client: {
          select: {
            name: true,
            identityCard: true,
          },
        },
        event: {
          select: {
            name: true,
            eventDate: true,
          },
        },
      },
    });

    const now = Date.now();

    return requests.map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      client: request.client,
      event: request.event,
      status: request.status,
      waitingTime:
        (now - new Date(request.createdAt).getTime()) / (1000 * 60 * 60),
    }));
  }
}

class DashboardService {
  private repository = new DashboardRepository();

  async getDashboardData(): Promise<
    ActionResult<{
      stats: DashboardStats;
      requestsByStatus: RequestsByStatus[];
      requestsByMonth: RequestsByMonth[];
      topClients: TopClient[];
      upcomingEvents: UpcomingEvent[];
      pendingRequests: PendingRequest[];
    }>
  > {
    try {
      const [
        stats,
        requestsByStatus,
        requestsByMonth,
        topClients,
        upcomingEvents,
        pendingRequests,
      ] = await Promise.all([
        this.repository.getGeneralStats(),
        this.repository.getRequestsByStatus(),
        this.repository.getRequestsByMonth(6),
        this.repository.getTopClients(5),
        this.repository.getUpcomingEvents(5),
        this.repository.getPendingRequests(10),
      ]);

      return {
        success: true,
        data: {
          stats,
          requestsByStatus,
          requestsByMonth,
          topClients,
          upcomingEvents,
          pendingRequests,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener datos del dashboard",
        code: "FETCH_ERROR",
      };
    }
  }
}

const dashboardService = new DashboardService();

export async function getDashboardData() {
  return dashboardService.getDashboardData();
}
