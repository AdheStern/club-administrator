// src/lib/actions/bulk-invitation-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertDecimalsToNumbers } from "./helpers/decimal-converter";
import { GuestHelper } from "./helpers/guest-helper";
import * as QRGenerator from "./helpers/qr-generator";
import type { ActionResult } from "./types/action-types";
import type {
  BulkInvitationItemDTO,
  BulkInvitationResult,
  CreateBulkInvitationsDTO,
} from "./types/bulk-invitation-types";

class BulkInvitationRepository {
  async createAndApprove(
    eventId: string,
    createdById: string,
    item: BulkInvitationItemDTO,
  ): Promise<string> {
    const table = await db.table.findUnique({
      where: { id: item.tableId },
      include: { sector: true },
    });

    if (!table) throw new Error(`Mesa ${item.tableId} no encontrada`);

    const existingRequest = await db.request.findFirst({
      where: {
        eventId,
        tableId: item.tableId,
        status: { in: ["PENDING", "OBSERVED", "PRE_APPROVED", "APPROVED"] },
      },
    });

    if (existingRequest) {
      throw new Error(`La mesa ${table.name} ya tiene una solicitud activa`);
    }

    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Evento no encontrado");

    const pkg = await db.package.findUnique({ where: { id: item.packageId } });
    if (!pkg) throw new Error(`Paquete ${item.packageId} no encontrado`);

    const client = await GuestHelper.findOrCreateGuest(item.clientData);
    const guestIds: string[] = [];

    if (table.sector.requiresGuestList && item.guestList.length > 0) {
      for (const guestData of item.guestList) {
        const guest = await GuestHelper.findOrCreateGuest(guestData);
        guestIds.push(guest.id);
      }
    }

    const requestId = crypto.randomUUID();
    const now = new Date();

    await db.request.create({
      data: {
        id: requestId,
        eventId,
        tableId: item.tableId,
        packageId: item.packageId,
        clientId: client.id,
        createdById,
        status: "APPROVED",
        isInvitation: true,
        isPaid: false,
        isPreApproved: true,
        hasConsumption: false,
        extraGuests: item.extraGuests,
        termsAccepted: true,
        approvedById: createdById,
        approvedAt: now,
        preApprovedAt: now,
        guestInvitations: {
          create: guestIds.map((guestId) => ({
            id: crypto.randomUUID(),
            guestId,
          })),
        },
      },
    });

    const eventInfo = {
      name: event.name,
      eventDate: event.eventDate,
      tableName: table.name,
      sectorName: table.sector.name,
    };

    const requiresGuestList = table.sector.requiresGuestList;
    const totalPeople = pkg.includedPeople + item.extraGuests;

    let qrPDFContent: string;

    if (requiresGuestList && guestIds.length > 0) {
      const allGuestIds = [client.id, ...guestIds];
      await GuestHelper.incrementEventsAttended(allGuestIds);

      const qrEntries = await QRGenerator.createQREntries(
        requestId,
        allGuestIds,
        eventInfo,
      );

      qrPDFContent = await QRGenerator.generateQRPDFContent(qrEntries);
    } else {
      await GuestHelper.incrementEventsAttended([client.id]);

      const anonymousQRs = await QRGenerator.createAnonymousQREntries(
        requestId,
        totalPeople,
        eventInfo,
      );

      qrPDFContent =
        await QRGenerator.generateAnonymousQRPDFContent(anonymousQRs);
    }

    return qrPDFContent;
  }
}

class BulkInvitationService {
  private repository = new BulkInvitationRepository();

  async createBulkInvitations(
    dto: CreateBulkInvitationsDTO,
  ): Promise<ActionResult<BulkInvitationResult>> {
    if (!dto.invitations.length) {
      return {
        success: false,
        error: "Debe agregar al menos una invitación",
        code: "EMPTY_INVITATIONS",
      };
    }

    const result: BulkInvitationResult = {
      succeeded: 0,
      failed: 0,
      errors: [],
      qrPDFContents: [],
    };

    for (const item of dto.invitations) {
      try {
        const qrPDFContent = await this.repository.createAndApprove(
          dto.eventId,
          dto.createdById,
          item,
        );

        result.succeeded++;
        result.qrPDFContents.push(qrPDFContent);
      } catch (error) {
        result.failed++;
        result.errors.push(
          error instanceof Error ? error.message : "Error desconocido",
        );
      }
    }

    revalidatePath("/requests");

    return { success: true, data: result };
  }
}

const bulkInvitationService = new BulkInvitationService();

export async function createBulkInvitations(dto: CreateBulkInvitationsDTO) {
  return bulkInvitationService.createBulkInvitations(dto);
}
