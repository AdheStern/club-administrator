"use server";

import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

interface GuestSearchResult {
  id: string;
  name: string;
  identityCard: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
}

class GuestService {
  async searchGuests(
    query: string,
  ): Promise<ActionResult<GuestSearchResult[]>> {
    try {
      if (query.length < 2) {
        return {
          success: true,
          data: [],
        };
      }

      const guests = await db.guest.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              identityCard: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
          NOT: {
            identityCard: {
              startsWith: "TEMP-",
            },
          },
        },
        select: {
          id: true,
          name: true,
          identityCard: true,
          phone: true,
          email: true,
          instagramHandle: true,
        },
        take: 10,
        orderBy: [
          {
            eventsAttended: "desc",
          },
          {
            name: "asc",
          },
        ],
      });

      return {
        success: true,
        data: guests,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al buscar invitados",
        code: "SEARCH_ERROR",
      };
    }
  }
}

const guestService = new GuestService();

export async function searchGuests(query: string) {
  return guestService.searchGuests(query);
}
