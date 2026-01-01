"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db"; // Asegúrate que el path sea correcto

export async function getEvents() {
  try {
    const events = await db.event.findMany({
      include: {
        tables: {
          include: { table: true },
        },
      },
      orderBy: { date: "desc" },
    });
    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: "Error fetching events" };
  }
}

export async function createEvent(data: {
  name: string;
  date: string;
  tableIds: string[];
}) {
  try {
    const event = await db.event.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        tables: {
          create: data.tableIds.map((tableId) => ({
            tableId,
            status: "AVAILABLE",
          })),
        },
      },
      include: {
        tables: { include: { table: true } },
      },
    });

    revalidatePath("/dashboard/events");
    return { success: true, data: event };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error creating event" };
  }
}

export async function updateEvent(
  eventId: string,
  data: { name: string; date: string; tableIds: string[] }
) {
  try {
    // Usamos una transacción para actualizar datos y sincronizar las mesas
    const event = await db.$transaction(async (tx) => {
      // 1. Actualizar datos básicos
      const updated = await tx.event.update({
        where: { id: eventId },
        data: {
          name: data.name,
          date: new Date(data.date),
        },
      });

      // 2. Sincronizar mesas: Borramos las anteriores y creamos las nuevas
      // (Método "nuclear" simple para prototipos)
      await tx.eventTableInstance.deleteMany({
        where: { eventId: eventId },
      });

      if (data.tableIds.length > 0) {
        await tx.eventTableInstance.createMany({
          data: data.tableIds.map((tableId) => ({
            eventId: eventId,
            tableId: tableId,
            status: "AVAILABLE",
          })),
        });
      }

      return updated;
    });

    revalidatePath("/dashboard/events");
    return { success: true, data: event };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error updating event" };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await db.event.delete({
      where: { id: eventId },
    });

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error deleting event" };
  }
}
