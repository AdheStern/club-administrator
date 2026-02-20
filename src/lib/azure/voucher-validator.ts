// src/lib/azure/voucher-validator.ts

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface VoucherValidationError {
  code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "NO_FILE";
  message: string;
}

export function validateVoucherFile(file: File): VoucherValidationError | null {
  if (!file || file.size === 0) {
    return { code: "NO_FILE", message: "No se seleccionó ningún archivo" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      code: "INVALID_TYPE",
      message: "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      message: "El archivo no puede superar los 5MB",
    };
  }

  return null;
}
