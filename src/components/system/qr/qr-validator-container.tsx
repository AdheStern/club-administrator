// src/components/system/qr/qr-validator-container.tsx

"use client";

import { QRScanHistory } from "./qr-scan-history";
import { QRScanner } from "./qr-scanner-camera";

interface QRValidatorContainerProps {
  userId: string;
  userRole: string;
}

export function QRValidatorContainer({
  userId,
  userRole,
}: QRValidatorContainerProps) {
  const canViewHistory = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validador de QR</h1>
        <p className="text-muted-foreground">
          Escanea los códigos QR para validar el ingreso de invitados
        </p>
      </div>

      <QRScanner userId={userId} />

      {canViewHistory && <QRScanHistory />}
    </div>
  );
}
