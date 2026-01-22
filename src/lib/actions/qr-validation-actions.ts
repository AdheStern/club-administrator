"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

interface QRValidationResult {
  isValid: boolean;
  isUsed: boolean;
  guest: {
    id: string;
    name: string;
    identityCard: string;
  } | null;
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
  qrType: string;
  remainingUses?: number;
}

interface QRHistoryItem {
  id: string;
  code: string;
  guest: {
    name: string;
    identityCard: string;
  } | null;
  usedAt: Date;
  scannedBy: {
    name: string;
  };
  qrType: string;
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
        scanHistory: {
          orderBy: {
            scannedAt: "desc",
          },
          take: 1,
          include: {
            scannedBy: {
              select: {
                name: true,
              },
            },
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

  async incrementUsage(qrEntryId: string, scannedById: string) {
    const qrEntry = await db.qREntry.update({
      where: { id: qrEntryId },
      data: {
        currentUses: {
          increment: 1,
        },
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

    await db.qRScan.create({
      data: {
        qrEntryId,
        scannedById,
      },
    });

    return qrEntry;
  }
}

class QRValidationService {
  private repository = new QRValidationRepository();

  private isQRUsed(qrEntry: {
    usageType: string;
    currentUses: number;
    maxUses: number | null;
    validFrom: Date | null;
    validUntil: Date | null;
  }): boolean {
    if (qrEntry.usageType === "SINGLE_USE") {
      return qrEntry.currentUses >= 1;
    }

    if (qrEntry.usageType === "MULTI_USE" && qrEntry.maxUses) {
      return qrEntry.currentUses >= qrEntry.maxUses;
    }

    if (qrEntry.usageType === "UNLIMITED") {
      return false;
    }

    if (qrEntry.usageType === "DATE_RANGE") {
      const now = new Date();
      if (qrEntry.validFrom && now < qrEntry.validFrom) return true;
      if (qrEntry.validUntil && now > qrEntry.validUntil) return true;
      return false;
    }

    return qrEntry.currentUses >= 1;
  }

  private getRemainingUses(qrEntry: {
    usageType: string;
    currentUses: number;
    maxUses: number | null;
  }): number | undefined {
    if (qrEntry.usageType === "SINGLE_USE") {
      return Math.max(0, 1 - qrEntry.currentUses);
    }

    if (qrEntry.usageType === "MULTI_USE" && qrEntry.maxUses) {
      return Math.max(0, qrEntry.maxUses - qrEntry.currentUses);
    }

    if (qrEntry.usageType === "UNLIMITED") {
      return undefined;
    }

    return undefined;
  }

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

      if (!qrEntry.isActive) {
        return {
          success: false,
          error: "Código QR desactivado",
          code: "INACTIVE_QR",
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

      const isUsed = this.isQRUsed(qrEntry);
      const lastScan = qrEntry.scanHistory[0];

      const result: QRValidationResult = {
        isValid: true,
        isUsed,
        guest: qrEntry.guest,
        request: {
          id: request.id,
          event: request.event,
          table: request.table,
          package: request.package,
        },
        qrType: qrEntry.usageType,
        remainingUses: this.getRemainingUses(qrEntry),
        ...(lastScan && {
          usedAt: lastScan.scannedAt,
          scannedBy: lastScan.scannedBy,
        }),
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error validating QR:", error);
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

      const qrEntry = await this.repository.findByCode(code);

      if (!qrEntry) {
        return {
          success: false,
          error: "Código QR no válido",
          code: "INVALID_QR",
        };
      }

      const updatedQR = await this.repository.incrementUsage(
        qrEntry.id,
        scannedById,
      );
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
        isUsed: this.isQRUsed(updatedQR),
        guest: updatedQR.guest,
        request: {
          id: request.id,
          event: request.event,
          table: request.table,
          package: request.package,
        },
        qrType: updatedQR.usageType,
        remainingUses: this.getRemainingUses(updatedQR),
        usedAt: new Date(),
        scannedBy: updatedQR.scannedBy!,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error scanning QR:", error);
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
    return await db.qRScan.findMany({
      take: limit,
      orderBy: {
        scannedAt: "desc",
      },
      include: {
        qrEntry: {
          include: {
            guest: {
              select: {
                name: true,
                identityCard: true,
              },
            },
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

  async getRecentScans(limit = 20): Promise<ActionResult<QRHistoryItem[]>> {
    try {
      const scans = await this.repository.getRecentScans(limit);

      const result = scans.map((scan) => ({
        id: scan.id,
        code: scan.qrEntry.code,
        guest: scan.qrEntry.guest,
        usedAt: scan.scannedAt,
        scannedBy: scan.scannedBy,
        qrType: scan.qrEntry.usageType,
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error fetching scan history:", error);
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
