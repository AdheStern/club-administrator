"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache"; // Importante para refrescar la UI
import { db } from "../db"; // Asegúrate que tu ruta a db sea correcta

export async function getTables() {
  try {
    const tables = await db.clubTable.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: tables };
  } catch (error) {
    console.error("Error fetching tables:", error);
    return { success: false, error: "Error al obtener las mesas" };
  }
}

export async function createTable(data: { name: string; capacity: number }) {
  try {
    const table = await db.clubTable.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        isActive: true,
        // Al ser opcional en el schema, no enviamos organizationId
      },
    });

    revalidatePath("/dashboard/tables"); // Ajusta esta ruta a donde esté tu lista
    return { success: true, data: table };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Ya existe una mesa con ese nombre" };
    }
    return { success: false, error: "Error al crear la mesa" };
  }
}

export async function updateTable(
  tableId: string,
  data: { name?: string; capacity?: number; isActive?: boolean }
) {
  try {
    const table = await db.clubTable.update({
      where: { id: tableId },
      data,
    });

    revalidatePath("/dashboard/tables");
    return { success: true, data: table };
  } catch (error) {
    return { success: false, error: "Error al actualizar la mesa" };
  }
}

export async function deleteTable(tableId: string) {
  try {
    await db.clubTable.delete({
      where: { id: tableId },
    });

    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar la mesa" };
  }
}
