// src/lib/services/push-notification-service.ts

import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export class PushNotificationService {
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          )
          .catch(async (error) => {
            if (error.statusCode === 410) {
              await db.pushSubscription.delete({ where: { id: sub.id } });
            }
          }),
      ),
    );
  }

  async sendToManagers(payload: PushPayload): Promise<void> {
    const managers = await db.user.findMany({
      where: { role: { in: MANAGER_ROLES }, status: "ACTIVE" },
      select: { id: true },
    });

    await Promise.allSettled(
      managers.map((manager) => this.sendToUser(manager.id, payload)),
    );
  }

  async notifyRequestCreated(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { name: true } },
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToManagers({
      title: "Nueva solicitud de reserva",
      body: `${request.client.name} solicitó mesa ${request.table.name} para ${request.event.name}`,
      tag: `request-created-${requestId}`,
      url: `/dashboard/requests/${requestId}`,
    });
  }

  async notifyRequestPreApproved(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToUser(request.createdById, {
      title: "Reserva pre-aprobada",
      body: `Tu mesa ${request.table.name} en ${request.event.name} fue pre-aprobada. Procede con el pago.`,
      tag: `request-preapproved-${requestId}`,
      url: `/dashboard/my-requests/${requestId}`,
    });
  }

  async notifyRequestPaid(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { name: true } },
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToManagers({
      title: "Pago recibido",
      body: `${request.client.name} marcó como pagada la mesa ${request.table.name} en ${request.event.name}`,
      tag: `request-paid-${requestId}`,
      url: `/dashboard/requests/${requestId}`,
    });
  }

  async notifyRequestApproved(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToUser(request.createdById, {
      title: "¡Reserva aprobada!",
      body: `Tu mesa ${request.table.name} en ${request.event.name} fue aprobada. Revisa tus QRs.`,
      tag: `request-approved-${requestId}`,
      url: `/dashboard/my-requests/${requestId}`,
    });
  }

  async notifyRequestObserved(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToUser(request.createdById, {
      title: "Solicitud observada",
      body: `Tu reserva para mesa ${request.table.name} en ${request.event.name} requiere atención.`,
      tag: `request-observed-${requestId}`,
      url: `/dashboard/my-requests/${requestId}`,
    });
  }

  async notifyRequestRejected(requestId: string): Promise<void> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        event: { select: { name: true } },
        table: { select: { name: true } },
      },
    });

    if (!request) return;

    await this.sendToUser(request.createdById, {
      title: "Solicitud rechazada",
      body: `Tu reserva para mesa ${request.table.name} en ${request.event.name} fue rechazada.`,
      tag: `request-rejected-${requestId}`,
      url: `/dashboard/my-requests/${requestId}`,
    });
  }
}

export const pushNotificationService = new PushNotificationService();
