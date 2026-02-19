// src/lib/actions/user-activity-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import type {
  ActionResult,
  UpsertUserActivityDTO,
  UserActivityDTO,
  UserOption,
} from "@/lib/actions/types/user-activity-types";
import { db } from "@/lib/db";

export async function getUsers(): Promise<ActionResult<UserOption[]>> {
  try {
    const users = await db.user.findMany({
      where: { status: "ACTIVE", role: "USER" },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: users };
  } catch {
    return { success: false, error: "Error al obtener usuarios" };
  }
}

export async function getUserActivitiesByMonth(
  userId: string,
  year: number,
  month: number,
): Promise<ActionResult<UserActivityDTO[]>> {
  try {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const activities = await db.userActivity.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
    });

    const data: UserActivityDTO[] = activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      date: a.date.toISOString().split("T")[0],
      hasActivity: a.hasActivity,
      description: a.description,
    }));

    return { success: true, data };
  } catch {
    return { success: false, error: "Error al obtener actividades" };
  }
}

export async function upsertUserActivity(
  dto: UpsertUserActivityDTO,
): Promise<ActionResult<UserActivityDTO>> {
  try {
    const date = new Date(dto.date);

    const activity = await db.userActivity.upsert({
      where: { userId_date: { userId: dto.userId, date } },
      create: {
        userId: dto.userId,
        date,
        hasActivity: dto.hasActivity,
        description: dto.description ?? null,
      },
      update: {
        hasActivity: dto.hasActivity,
        description: dto.description ?? null,
      },
    });

    revalidatePath("/user-activity");

    return {
      success: true,
      data: {
        id: activity.id,
        userId: activity.userId,
        date: activity.date.toISOString().split("T")[0],
        hasActivity: activity.hasActivity,
        description: activity.description,
      },
    };
  } catch {
    return { success: false, error: "Error al guardar actividad" };
  }
}

export async function deleteUserActivity(
  userId: string,
  date: string,
): Promise<ActionResult> {
  try {
    await db.userActivity.delete({
      where: { userId_date: { userId, date: new Date(date) } },
    });
    revalidatePath("/user-activity");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar actividad" };
  }
}
