// src/components/system/requests/payment-voucher-upload.tsx

"use client";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadPaymentVoucher } from "@/lib/actions/upload-actions";

interface PaymentVoucherUploadProps {
  requestId: string;
  existingVoucherUrl?: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export function PaymentVoucherUpload({
  requestId,
  existingVoucherUrl,
  onUploaded,
  disabled = false,
}: PaymentVoucherUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingVoucherUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.append("voucher", file);

    setIsUploading(true);
    try {
      const result = await uploadPaymentVoucher(formData, requestId);

      if (result.success && result.data) {
        onUploaded(result.data.url);
        toast.success("Voucher subido correctamente");
      } else {
        setPreviewUrl(existingVoucherUrl ?? null);
        toast.error(result.error ?? "Error al subir el voucher");
      }
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isPdf =
    previewUrl?.toLowerCase().includes(".pdf") ||
    previewUrl?.includes("application/pdf");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Voucher de pago</p>

      {previewUrl ? (
        <div className="relative rounded-lg border bg-muted overflow-hidden">
          {isPdf ? (
            <div className="flex items-center gap-3 p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                Voucher adjunto (PDF)
              </span>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] max-h-64">
              <Image
                src={previewUrl}
                alt="Voucher de pago"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 rounded-full bg-background/80 p-1 shadow hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Quitar voucher</span>
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center transition-colors hover:border-muted-foreground/60 hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {isUploading
              ? "Subiendo..."
              : "Clic para adjuntar voucher (JPG, PNG, PDF · máx 5MB)"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Subiendo a Azure Blob Storage...</span>
        </div>
      )}
    </div>
  );
}
