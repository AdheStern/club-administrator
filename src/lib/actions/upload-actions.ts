// src/lib/actions/upload-actions.ts

"use server";
import { validateVoucherFile } from "@/lib/azure/voucher-validator";
import { buildBlobName, uploadBlob } from "../azure/blob-storage";
import type { ActionResult } from "./types/action-types";

export async function uploadPaymentVoucher(
  formData: FormData,
  requestId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const file = formData.get("voucher") as File | null;

    if (!file) {
      return {
        success: false,
        error: "No se recibió ningún archivo",
        code: "NO_FILE",
      };
    }

    const validationError = validateVoucherFile(file);
    if (validationError) {
      return {
        success: false,
        error: validationError.message,
        code: validationError.code,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const blobName = buildBlobName("vouchers", requestId, file.name);
    const url = await uploadBlob(blobName, buffer, file.type);

    return { success: true, data: { url } };
  } catch (error) {
    console.error("Error al subir el voucher:", error);
    return {
      success: false,
      error: "Error al subir el voucher. Intente nuevamente.",
      code: "UPLOAD_ERROR",
    };
  }
}
