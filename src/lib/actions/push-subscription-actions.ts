// src/lib/actions/push-subscription-actions.ts

"use server";

import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

export interface SubscribeDTO {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function subscribeToPush(
  dto: SubscribeDTO,
): Promise<ActionResult> {
  try {
    await db.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        p256dh: dto.p256dh,
        auth: dto.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: dto.userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Error al guardar suscripción push",
      code: "SUBSCRIBE_ERROR",
    };
  }
}

export async function unsubscribeFromPush(
  endpoint: string,
): Promise<ActionResult> {
  try {
    await db.pushSubscription.deleteMany({ where: { endpoint } });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Error al eliminar suscripción push",
      code: "UNSUBSCRIBE_ERROR",
    };
  }
}
