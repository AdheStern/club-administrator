// src/lib/actions/user-sector-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

interface SectorBasic {
  id: string;
  name: string;
}

export async function getUserSectors(
  userId: string
): Promise<ActionResult<SectorBasic[]>> {
  try {
    const userSectors = await db.userSector.findMany({
      where: { userId },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const sectors = userSectors.map((us) => us.sector);

    return {
      success: true,
      data: sectors,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener sectores del usuario",
      code: "FETCH_ERROR",
    };
  }
}

export async function updateUserSectors(
  userId: string,
  sectorIds: string[]
): Promise<ActionResult<void>> {
  try {
    await db.$transaction(async (tx) => {
      await tx.userSector.deleteMany({
        where: { userId },
      });

      if (sectorIds.length > 0) {
        await tx.userSector.createMany({
          data: sectorIds.map((sectorId) => ({
            id: crypto.randomUUID(),
            userId,
            sectorId,
            createdAt: new Date(),
          })),
        });
      }
    });

    revalidatePath("/administration");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar sectores del usuario",
      code: "UPDATE_ERROR",
    };
  }
}

export async function getAllSectors(): Promise<ActionResult<SectorBasic[]>> {
  try {
    const sectors = await db.sector.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: sectors,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener sectores",
      code: "FETCH_ERROR",
    };
  }
}

export async function canUserAccessSector(
  userId: string,
  sectorId: string
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return true;
    }

    const userSector = await db.userSector.findUnique({
      where: {
        userId_sectorId: {
          userId,
          sectorId,
        },
      },
    });

    return !!userSector;
  } catch {
    return false;
  }
}
