// src/lib/actions/export-actions.ts
"use server";

import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import type { ActionResult } from "./types/action-types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  OBSERVED: "Observada",
  PRE_APPROVED: "Pre-Aprobada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const STATUS_COLORS: Record<string, { bg: string; font: string }> = {
  PENDING: { bg: "FEF9C3", font: "854D0E" },
  OBSERVED: { bg: "FFEDD5", font: "9A3412" },
  PRE_APPROVED: { bg: "DBEAFE", font: "1E40AF" },
  APPROVED: { bg: "DCFCE7", font: "166534" },
  REJECTED: { bg: "FEE2E2", font: "991B1B" },
};

const COLOR_HEADER_BG = "1E1E2E";
const COLOR_ACCENT = "6366F1";
const COLOR_ALT_ROW = "F5F5FA";
const COLOR_BORDER = "CCCCDD";

export interface ExportRequestsDTO {
  eventId?: string;
  sectorId?: string;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function applyBorder(cell: ExcelJS.Cell) {
  const side: ExcelJS.BorderStyle = "thin";
  cell.border = {
    top: { style: side, color: { argb: `FF${COLOR_BORDER}` } },
    bottom: { style: side, color: { argb: `FF${COLOR_BORDER}` } },
    left: { style: side, color: { argb: `FF${COLOR_BORDER}` } },
    right: { style: side, color: { argb: `FF${COLOR_BORDER}` } },
  };
}

export async function exportRequestsToExcel(
  dto: ExportRequestsDTO,
): Promise<ActionResult<{ buffer: number[]; fileName: string }>> {
  try {
    const requests = await db.request.findMany({
      where: {
        status: "APPROVED",
        ...(dto.eventId && { eventId: dto.eventId }),
        ...(dto.sectorId && { table: { sectorId: dto.sectorId } }),
      },
      include: {
        event: { select: { name: true, eventDate: true } },
        table: { include: { sector: { select: { name: true } } } },
        package: {
          select: { name: true, includedPeople: true, basePrice: true },
        },
        client: { select: { name: true, identityCard: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const eventLabel = dto.eventId
      ? (requests[0]?.event.name ?? "Evento")
      : "Todos los eventos";
    const sectorLabel = dto.sectorId
      ? (requests[0]?.table.sector.name ?? "Sector")
      : "Todos los sectores";

    const wb = new ExcelJS.Workbook();
    wb.creator = "JET CLUB Sistema";
    wb.created = new Date();

    const ws = wb.addWorksheet("Solicitudes", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    const COLUMNS: { header: string; width: number }[] = [
      { header: "N°", width: 5 },
      { header: "Evento", width: 28 },
      { header: "Fecha Evento", width: 14 },
      { header: "Cliente", width: 22 },
      { header: "CI", width: 12 },
      { header: "Sector", width: 16 },
      { header: "Mesa", width: 12 },
      { header: "Paquete", width: 18 },
      { header: "Precio Paquete", width: 14 },
      { header: "Personas", width: 10 },
      { header: "Con Consumo", width: 13 },
      { header: "Estado", width: 14 },
      { header: "Pagado", width: 10 },
      { header: "Creado Por", width: 20 },
      { header: "Fecha Solicitud", width: 16 },
    ];

    ws.columns = COLUMNS.map((c) => ({ width: c.width }));

    // ── Fila 1: Título ────────────────────────────────────────────────────────
    ws.mergeCells(1, 1, 1, COLUMNS.length);
    const titleCell = ws.getCell("A1");
    titleCell.value = "JET CLUB · REPORTE DE SOLICITUDES";
    titleCell.font = {
      name: "Arial",
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${COLOR_HEADER_BG}` },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 36;

    // ── Fila 2: Metadata ──────────────────────────────────────────────────────
    ws.mergeCells(2, 1, 2, COLUMNS.length);
    const metaCell = ws.getCell("A2");
    metaCell.value = `Evento: ${eventLabel}  ·  Sector: ${sectorLabel}  ·  Generado: ${formatDate(new Date())}  ·  Total: ${requests.length} registros`;
    metaCell.font = {
      name: "Arial",
      italic: true,
      size: 9,
      color: { argb: "FF888888" },
    };
    metaCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 18;

    // ── Fila 3: Cabeceras ─────────────────────────────────────────────────────
    const headerRow = ws.getRow(3);
    headerRow.height = 22;
    COLUMNS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = {
        name: "Arial",
        bold: true,
        size: 10,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${COLOR_ACCENT}` },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      applyBorder(cell);
    });

    ws.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: COLUMNS.length },
    };

    // ── Filas de datos ────────────────────────────────────────────────────────
    requests.forEach((req, idx) => {
      const rowIdx = idx + 4;
      const isAlt = idx % 2 === 1;
      const rowBg = isAlt ? COLOR_ALT_ROW : "FFFFFF";
      const totalPeople = (req.package?.includedPeople ?? 0) + req.extraGuests;

      const values: (string | number | boolean)[] = [
        idx + 1,
        req.event.name,
        formatDate(req.event.eventDate),
        req.client.name,
        req.client.identityCard,
        req.table.sector.name,
        req.table.name,
        req.package?.name ?? "-",
        Number(req.package?.basePrice ?? 0),
        totalPeople,
        req.hasConsumption,
        req.status,
        req.isPaid,
        req.createdBy?.name ?? "Sistema",
        formatDate(req.createdAt),
      ];

      const dataRow = ws.getRow(rowIdx);
      dataRow.height = 18;

      values.forEach((val, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        const colNum = colIdx + 1;

        applyBorder(cell);

        // Estado (col 12)
        if (colNum === 12) {
          const status = val as string;
          const colors = STATUS_COLORS[status] ?? {
            bg: "FFFFFF",
            font: "000000",
          };
          cell.value = STATUS_LABELS[status] ?? status;
          cell.font = {
            name: "Arial",
            bold: true,
            size: 9,
            color: { argb: `FF${colors.font}` },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: `FF${colors.bg}` },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          return;
        }

        // Pagado (col 13) y Con Consumo (col 11)
        if (colNum === 13 || colNum === 11) {
          const flag = val as boolean;
          cell.value = flag ? "Sí" : "No";
          cell.font = {
            name: "Arial",
            size: 9,
            bold: true,
            color: { argb: flag ? "FF166534" : "FF991B1B" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: `FF${rowBg}` },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          return;
        }

        // Precio paquete (col 9) — formato moneda
        if (colNum === 9) {
          cell.value = val as number;
          cell.numFmt = '"Bs." #,##0.00';
          cell.font = { name: "Arial", size: 9, color: { argb: "FF1A1A2E" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: `FF${rowBg}` },
          };
          cell.alignment = { horizontal: "right", vertical: "middle" };
          return;
        }

        cell.value = val;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${rowBg}` },
        };
        cell.font = {
          name: "Arial",
          size: 9,
          color:
            colNum === 1 ? { argb: `FF${COLOR_ACCENT}` } : { argb: "FF1A1A2E" },
          bold: colNum === 1,
        };
        cell.alignment = {
          horizontal: [1, 10].includes(colNum) ? "center" : "left",
          vertical: "middle",
        };
      });
    });

    // ── Fila de totales ───────────────────────────────────────────────────────
    const totalRow = requests.length + 4;
    ws.mergeCells(totalRow, 1, totalRow, COLUMNS.length);
    const totalCell = ws.getCell(totalRow, 1);
    totalCell.value = `TOTAL: ${requests.length} solicitudes exportadas`;
    totalCell.font = {
      name: "Arial",
      bold: true,
      size: 10,
      color: { argb: "FFFFFFFF" },
    };
    totalCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${COLOR_HEADER_BG}` },
    };
    totalCell.alignment = { horizontal: "right", vertical: "middle" };
    ws.getRow(totalRow).height = 20;

    const arrayBuffer = await wb.xlsx.writeBuffer();
    const buffer = Array.from(new Uint8Array(arrayBuffer));

    const safeName = eventLabel
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "")
      .trim();
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `Solicitudes-${safeName}-${dateStamp}.xlsx`;

    return { success: true, data: { buffer, fileName } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al exportar",
      code: "EXPORT_ERROR",
    };
  }
}

export async function getSectorsForExport(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  try {
    const sectors = await db.sector.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: sectors };
  } catch {
    return {
      success: false,
      error: "Error al obtener sectores",
      code: "FETCH_ERROR",
    };
  }
}
