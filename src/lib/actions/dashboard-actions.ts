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

export interface UserPerformance {
  userId: string;
  userName: string;
  requestsCreated: number;
  requestsApproved: number;
  approvalRate: number;
  avgResponseTime: number;
}

export interface DashboardFilters {
  eventId?: string;
  sectorId?: string;
  tableId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FilterOptions {
  events: Array<{ value: string; label: string }>;
  sectors: Array<{ value: string; label: string }>;
  tables: Array<{ value: string; label: string }>;
  users: Array<{ value: string; label: string }>;
}

class DashboardRepository {
  async getGeneralStats(filters?: DashboardFilters): Promise<DashboardStats> {
    const now = new Date();
    const whereClause = this.buildRequestWhereClause(filters);

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
      db.request.count({ where: whereClause }),
      db.request.count({
        where: {
          ...whereClause,
          status: "PENDING",
        },
      }),
      db.request.count({
        where: {
          ...whereClause,
          status: "APPROVED",
        },
      }),
      db.request.count({
        where: {
          ...whereClause,
          status: "REJECTED",
        },
      }),
      db.request.count({
        where: {
          ...whereClause,
          status: "OBSERVED",
        },
      }),
      db.event.count(),
      db.event.count({
        where: {
          eventDate: {
            gte: now,
          },
          isActive: true,
        },
      }),
      db.guest.count(),
      db.request.findMany({
        where: {
          ...whereClause,
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

  async getRequestsByStatus(
    filters?: DashboardFilters,
  ): Promise<RequestsByStatus[]> {
    const whereClause = this.buildRequestWhereClause(filters);

    const requests = await db.request.groupBy({
      by: ["status"],
      where: whereClause,
      _count: true,
    });

    const total = requests.reduce((sum, item) => sum + item._count, 0);

    return requests.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
    }));
  }

  async getRequestsByMonth(
    filters?: DashboardFilters,
    months: number = 6,
  ): Promise<RequestsByMonth[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - months);

    const whereClause = this.buildRequestWhereClause(filters);

    const requests = await db.request.findMany({
      where: {
        ...whereClause,
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

  async getTopClients(
    filters?: DashboardFilters,
    limit: number = 5,
  ): Promise<TopClient[]> {
    const whereClause = this.buildRequestWhereClause(filters);

    const clients = await db.guest.findMany({
      where: {
        requestsAsClient: {
          some: whereClause,
        },
      },
      orderBy: [{ eventsAttended: "desc" }, { loyaltyPoints: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        identityCard: true,
        eventsAttended: true,
        loyaltyPoints: true,
        requestsAsClient: {
          where: whereClause,
          select: {
            id: true,
          },
        },
      },
    });

    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      identityCard: client.identityCard,
      requestCount: client.requestsAsClient.length,
      eventsAttended: client.eventsAttended,
      loyaltyPoints: client.loyaltyPoints,
    }));
  }

  async getUpcomingEvents(
    filters?: DashboardFilters,
    limit: number = 5,
  ): Promise<UpcomingEvent[]> {
    const now = new Date();

    const eventWhere: any = {
      eventDate: {
        gte: now,
      },
      isActive: true,
    };

    if (filters?.eventId && filters.eventId !== "all") {
      eventWhere.id = filters.eventId;
    }

    const events = await db.event.findMany({
      where: eventWhere,
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
          where: this.buildRequestWhereClause(filters),
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
        (r) => r.status === "PENDING" || r.status === "OBSERVED",
      ).length,
    }));
  }

  async getPendingRequests(
    filters?: DashboardFilters,
    limit: number = 10,
  ): Promise<PendingRequest[]> {
    const whereClause = this.buildRequestWhereClause(filters);

    const requests = await db.request.findMany({
      where: {
        ...whereClause,
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

  async getUserPerformance(
    filters?: DashboardFilters,
    limit: number = 10,
  ): Promise<UserPerformance[]> {
    const whereClause = this.buildRequestWhereClause(filters);

    const userFilter: any = {
      role: { in: ["ADMIN", "MANAGER", "SUPERVISOR"] },
      status: "ACTIVE",
    };

    if (filters?.userId && filters.userId !== "all") {
      userFilter.id = filters.userId;
    }

    const users = await db.user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        requestsCreated: {
          where: whereClause,
          select: {
            id: true,
            status: true,
            createdAt: true,
            approvedAt: true,
          },
        },
      },
      take: limit,
    });

    const userPerformanceData = users
      .map((user) => {
        const requestsCreated = user.requestsCreated.length;
        const requestsApproved = user.requestsCreated.filter(
          (r) => r.status === "APPROVED",
        ).length;
        const approvalRate =
          requestsCreated > 0 ? (requestsApproved / requestsCreated) * 100 : 0;

        const approvedWithTime = user.requestsCreated.filter(
          (r) => r.status === "APPROVED" && r.approvedAt,
        );
        const avgResponseTime =
          approvedWithTime.length > 0
            ? approvedWithTime.reduce((sum, req) => {
                const hours =
                  (new Date(req.approvedAt!).getTime() -
                    new Date(req.createdAt).getTime()) /
                  (1000 * 60 * 60);
                return sum + hours;
              }, 0) / approvedWithTime.length
            : 0;

        return {
          userId: user.id,
          userName: user.name,
          requestsCreated,
          requestsApproved,
          approvalRate,
          avgResponseTime,
        };
      })
      .filter((u) => u.requestsCreated > 0)
      .sort((a, b) => b.requestsApproved - a.requestsApproved);

    return userPerformanceData;
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const [events, sectors, tables, users] = await Promise.all([
      db.event.findMany({
        where: { isActive: true },
        select: { id: true, name: true, eventDate: true },
        orderBy: { eventDate: "desc" },
        take: 50,
      }),
      db.sector.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.table.findMany({
        where: { isActive: true },
        select: { id: true, name: true, sectorId: true },
        orderBy: { name: "asc" },
      }),
      db.user.findMany({
        where: {
          role: { in: ["ADMIN", "MANAGER", "SUPERVISOR"] },
          status: "ACTIVE",
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      events: events.map((e) => ({ value: e.id, label: e.name })),
      sectors: sectors.map((s) => ({ value: s.id, label: s.name })),
      tables: tables.map((t) => ({ value: t.id, label: t.name })),
      users: users.map((u) => ({ value: u.id, label: u.name })),
    };
  }

  private buildRequestWhereClause(filters?: DashboardFilters) {
    const where: any = {};

    if (filters?.dateFrom) {
      where.createdAt = { gte: filters.dateFrom };
    }

    if (filters?.dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.dateTo,
      };
    }

    if (filters?.eventId && filters.eventId !== "all") {
      where.eventId = filters.eventId;
    }

    if (filters?.sectorId && filters.sectorId !== "all") {
      where.table = {
        sectorId: filters.sectorId,
      };
    }

    if (filters?.tableId && filters.tableId !== "all") {
      where.tableId = filters.tableId;
    }

    if (filters?.userId && filters.userId !== "all") {
      where.createdById = filters.userId;
    }

    return where;
  }
}

class DashboardService {
  private repository = new DashboardRepository();

  async getDashboardData(filters?: DashboardFilters): Promise<
    ActionResult<{
      stats: DashboardStats;
      requestsByStatus: RequestsByStatus[];
      requestsByMonth: RequestsByMonth[];
      topClients: TopClient[];
      upcomingEvents: UpcomingEvent[];
      pendingRequests: PendingRequest[];
      userPerformance: UserPerformance[];
      filterOptions: FilterOptions;
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
        userPerformance,
        filterOptions,
      ] = await Promise.all([
        this.repository.getGeneralStats(filters),
        this.repository.getRequestsByStatus(filters),
        this.repository.getRequestsByMonth(filters, 6),
        this.repository.getTopClients(filters, 5),
        this.repository.getUpcomingEvents(filters, 5),
        this.repository.getPendingRequests(filters, 10),
        this.repository.getUserPerformance(filters, 10),
        this.repository.getFilterOptions(),
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
          userPerformance,
          filterOptions,
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

export async function getDashboardData(filters?: DashboardFilters) {
  return dashboardService.getDashboardData(filters);
}
