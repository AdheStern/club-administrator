// src/lib/azure/image-validator.ts

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export interface ImageValidationError {
  code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "NO_FILE";
  message: string;
}

export function validateImageFile(file: File): ImageValidationError | null {
  if (!file || file.size === 0) {
    return { code: "NO_FILE", message: "No se seleccionó ningún archivo" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return {
      code: "INVALID_TYPE",
      message: "Solo se permiten imágenes JPG, PNG o WebP",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      message: "La imagen no puede superar los 10MB",
    };
  }

  return null;
}
