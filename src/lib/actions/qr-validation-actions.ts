// /src/lib/actions/qr-validation-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertDecimalsToNumbers } from "./helpers/decimal-converter";
import type { ActionResult } from "./types/action-types";

interface QRValidationResult {
  isValid: boolean;
  isUsed: boolean;
  guest: {
    id: string;
    name: string;
    identityCard: string;
  };
  request: {
    id: string;
    event: {
      name: string;
      eventDate: Date;
    };
    table: {
      name: string;
      sector: {
        name: string;
      };
    };
    package: {
      name: string;
    };
  };
  usedAt?: Date;
  scannedBy?: {
    name: string;
  };
}

class QRValidationRepository {
  async findByCode(code: string) {
    return await db.qREntry.findUnique({
      where: { code },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            identityCard: true,
          },
        },
        scannedBy: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findRequestById(requestId: string) {
    return await db.request.findUnique({
      where: { id: requestId },
      include: {
        event: {
          select: {
            name: true,
            eventDate: true,
          },
        },
        table: {
          select: {
            name: true,
            sector: {
              select: {
                name: true,
              },
            },
          },
        },
        package: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async markAsUsed(code: string, scannedById: string) {
    return await db.qREntry.update({
      where: { code },
      data: {
        isUsed: true,
        usedAt: new Date(),
        scannedById,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            identityCard: true,
          },
        },
        scannedBy: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}

class QRValidationService {
  private repository = new QRValidationRepository();

  async validateQR(code: string): Promise<ActionResult<QRValidationResult>> {
    try {
      const qrEntry = await this.repository.findByCode(code);

      if (!qrEntry) {
        return {
          success: false,
          error: "Código QR no válido",
          code: "INVALID_QR",
        };
      }

      const request = await this.repository.findRequestById(qrEntry.requestId);

      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "REQUEST_NOT_FOUND",
        };
      }

      const result: QRValidationResult = {
        isValid: true,
        isUsed: qrEntry.isUsed,
        guest: qrEntry.guest,
        request: {
          id: request.id,
          event: request.event,
          table: request.table,
          package: request.package,
        },
        ...(qrEntry.isUsed && {
          usedAt: qrEntry.usedAt!,
          scannedBy: qrEntry.scannedBy!,
        }),
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: "Error al validar código QR",
        code: "VALIDATION_ERROR",
      };
    }
  }

  async scanQR(
    code: string,
    scannedById: string,
  ): Promise<ActionResult<QRValidationResult>> {
    try {
      const validationResult = await this.validateQR(code);

      if (!validationResult.success) {
        return validationResult;
      }

      if (validationResult.data!.isUsed) {
        return {
          success: false,
          error: "Este código QR ya fue utilizado",
          code: "ALREADY_USED",
          data: validationResult.data,
        };
      }

      const updatedQR = await this.repository.markAsUsed(code, scannedById);
      const request = await this.repository.findRequestById(
        updatedQR.requestId,
      );

      if (!request) {
        return {
          success: false,
          error: "Solicitud no encontrada",
          code: "REQUEST_NOT_FOUND",
        };
      }

      revalidatePath("/qr-validator");

      const result: QRValidationResult = {
        isValid: true,
        isUsed: true,
        guest: updatedQR.guest,
        request: {
          id: request.id,
          event: request.event,
          table: request.table,
          package: request.package,
        },
        usedAt: updatedQR.usedAt!,
        scannedBy: updatedQR.scannedBy!,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: "Error al escanear código QR",
        code: "SCAN_ERROR",
      };
    }
  }
}

class QRHistoryRepository {
  async getRecentScans(limit: number) {
    return await db.qREntry.findMany({
      where: {
        isUsed: true,
      },
      take: limit,
      orderBy: {
        usedAt: "desc",
      },
      include: {
        guest: {
          select: {
            name: true,
            identityCard: true,
          },
        },
        scannedBy: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}

class QRHistoryService {
  private repository = new QRHistoryRepository();

  async getRecentScans(limit: number = 20): Promise<
    ActionResult<
      Array<{
        id: string;
        code: string;
        guest: {
          name: string;
          identityCard: string;
        };
        usedAt: Date;
        scannedBy: {
          name: string;
        };
      }>
    >
  > {
    try {
      const scans = await this.repository.getRecentScans(limit);

      const result = scans.map((scan) => ({
        id: scan.id,
        code: scan.code,
        guest: scan.guest,
        usedAt: scan.usedAt!,
        scannedBy: scan.scannedBy!,
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: "Error al obtener historial de escaneos",
        code: "FETCH_ERROR",
      };
    }
  }
}

const qrValidationService = new QRValidationService();
const qrHistoryService = new QRHistoryService();

export async function validateQR(code: string) {
  return qrValidationService.validateQR(code);
}

export async function scanQR(code: string, scannedById: string) {
  return qrValidationService.scanQR(code, scannedById);
}

export async function getRecentScans(limit?: number) {
  return qrHistoryService.getRecentScans(limit);
}
