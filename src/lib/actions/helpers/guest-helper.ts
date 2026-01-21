// src/lib/actions/helpers/guest-helper.ts

import { db } from "@/lib/db";
import type { GuestData } from "../types/request-types";

export class GuestHelper {
  static async findOrCreateGuest(data: GuestData) {
    let guest = await db.guest.findUnique({
      where: { identityCard: data.identityCard },
    });

    if (!guest) {
      guest = await db.guest.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          identityCard: data.identityCard,
          phone: data.phone,
          email: data.email,
          instagramHandle: data.instagramHandle,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      guest = await db.guest.update({
        where: { id: guest.id },
        data: {
          name: data.name,
          phone: data.phone ?? guest.phone,
          email: data.email ?? guest.email,
          instagramHandle: data.instagramHandle ?? guest.instagramHandle,
          updatedAt: new Date(),
        },
      });
    }

    return guest;
  }

  static async incrementEventsAttended(guestIds: string[]) {
    await db.guest.updateMany({
      where: { id: { in: guestIds } },
      data: {
        eventsAttended: { increment: 1 },
        loyaltyPoints: { increment: 10 },
        updatedAt: new Date(),
      },
    });
  }
}
