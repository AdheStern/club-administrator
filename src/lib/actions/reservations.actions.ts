"use server";

import type { Reservation, ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "../db";

// --- FUNCIÓN AUXILIAR PARA EL PROTOTIPO ---
// Esto asegura que siempre exista un usuario para ligar la reserva,
// sin importar si la base de datos está vacía.
async function ensureDemoUser(userId: string, name: string, email: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user) return user.id;

  // Si no existe, buscamos el primer usuario disponible (por si ya creaste uno manual)
  const firstUser = await db.user.findFirst();
  if (firstUser) return firstUser.id;

  // Si la BD está totalmente vacía, creamos el usuario demo
  console.log(`Creating demo user: ${name}`);
  const newUser = await db.user.create({
    data: {
      id: userId,
      name: name,
      email: email,
      emailVerified: true,
      image: "", // Opcional
    },
  });
  return newUser.id;
}
// ------------------------------------------

export async function getReservationsByEvent(eventId: string) {
  try {
    const reservations = await db.reservation.findMany({
      where: { eventId },
      include: {
        seller: true,
        approver: true,
        tableInstance: {
          include: { table: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reservations };
  } catch (error) {
    return { success: false, error: "Error al obtener reservas" };
  }
}

export async function createReservation(
  eventId: string,
  tableInstanceId: string,
  sellerId: string, // Viene del frontend como "user-demo-id"
  data: {
    customerName: string;
    customerDoc: string;
    extraGuests?: number;
    hasConsumption?: boolean;
  }
) {
  try {
    // 1. Aseguramos que el vendedor exista para evitar el error P2003
    const validSellerId = await ensureDemoUser(
      sellerId,
      "Vendedor Demo",
      "seller@demo.com"
    );

    // 2. Iniciamos la transacción
    const result = await db.$transaction(async (tx) => {
      // Crear la reserva
      const reservation = await tx.reservation.create({
        data: {
          eventId,
          tableInstanceId,
          sellerId: validSellerId, // Usamos el ID validado
          customerName: data.customerName,
          customerDoc: data.customerDoc,
          extraGuests: data.extraGuests || 0,
          hasConsumption: data.hasConsumption || false,
          status: "PENDING",
        },
        include: { seller: true, tableInstance: { include: { table: true } } },
      });

      // Marcar mesa como RESERVADA
      await tx.eventTableInstance.update({
        where: { id: tableInstanceId },
        data: { status: "RESERVED" },
      });

      return reservation;
    });

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard"); // Para actualizar los gráficos
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return { success: false, error: "Error al crear la reserva" };
  }
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  approverId: string, // Viene como "approver-demo-id"
  notes?: string
) {
  try {
    // 1. Aseguramos que el aprobador exista
    const validApproverId = await ensureDemoUser(
      approverId,
      "Aprobador Demo",
      "admin@demo.com"
    );

    const result = await db.$transaction(async (tx) => {
      const currentReservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!currentReservation) throw new Error("Reserva no encontrada");

      // Actualizar estado
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status,
          approverId: validApproverId, // Usamos el ID validado
          notes,
          respondedAt: new Date(),
        },
        include: {
          seller: true,
          approver: true,
          tableInstance: { include: { table: true } },
        },
      });

      // Liberar mesa si se rechaza o cancela
      if (status === "REJECTED" || status === "CANCELLED") {
        await tx.eventTableInstance.update({
          where: { id: currentReservation.tableInstanceId },
          data: { status: "AVAILABLE" },
        });
      }

      return updatedReservation;
    });

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Error al actualizar estado" };
  }
}

export async function getReservationStats(eventId: string) {
  try {
    const reservations = await db.reservation.findMany({
      where: { eventId },
    });

    const stats = {
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "PENDING").length,
      approved: reservations.filter((r) => r.status === "APPROVED").length,
      observed: reservations.filter((r) => r.status === "OBSERVED").length,
      rejected: reservations.filter((r) => r.status === "REJECTED").length,
      avgApprovalTime: calculateAvgApprovalTime(reservations),
    };

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: "Error calculating stats" };
  }
}

function calculateAvgApprovalTime(reservations: Reservation[]): number {
  const approved = reservations.filter((r) => r.respondedAt && r.createdAt);
  if (approved.length === 0) return 0;

  const times = approved.map((r) => {
    const diff =
      new Date(r.respondedAt!).getTime() - new Date(r.createdAt).getTime();
    return diff / (1000 * 60); // minutos
  });

  const total = times.reduce((a, b) => a + b, 0);
  return Math.round(total / times.length);
}
