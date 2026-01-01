"use server";

import { db } from "../db";

export async function getDashboardStats() {
  try {
    // Ejecutamos todas las consultas en paralelo para máxima velocidad
    const [
      totalTables,
      activeTables,
      totalEvents,
      totalReservations,
      pendingReservations,
      recentReservations,
    ] = await Promise.all([
      // 1. Total Mesas
      db.clubTable.count(),

      // 2. Mesas Activas
      db.clubTable.count({ where: { isActive: true } }),

      // 3. Total Eventos
      db.event.count(),

      // 4. Total Reservas
      db.reservation.count(),

      // 5. Reservas Pendientes
      db.reservation.count({ where: { status: "PENDING" } }),

      // 6. Últimas 5 reservas (con datos mínimos necesarios)
      db.reservation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerName: true,
          customerDoc: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        stats: {
          totalTables,
          activeTables,
          totalEvents,
          totalReservations,
          pendingReservations,
        },
        recentReservations,
      },
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    return { success: false, error: "Error loading dashboard data" };
  }
}
