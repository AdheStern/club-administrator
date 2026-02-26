// src/components/system/qr/qr-scanner-camera.tsx
"use client";

import { Html5Qrcode } from "html5-qrcode";
import { AlertTriangle, Camera, KeyboardIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scanQR } from "@/lib/actions/qr-validation-actions";
import { QRScanResult } from "./qr-scan-result";

interface QRScannerProps {
  userId: string;
}

interface ScanResult {
  success: boolean;
  guest: {
    name: string;
    identityCard: string;
  };
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
  scannedBy?: {
    name: string;
  };
  usedAt?: Date;
  errorMessage?: string;
  errorCode?: string;
}

export function QRScanner({ userId }: QRScannerProps) {
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied" | "checking"
  >("checking");
  const [isHttps, setIsHttps] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkEnvironment();
  }, []);

  async function checkEnvironment() {
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    setIsHttps(isSecure);

    if (!isSecure) {
      setCameraError("Se requiere HTTPS para usar la cámara");
      setShowManualInput(true);
      return;
    }

    try {
      const permission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setCameraPermission(permission.state);

      permission.addEventListener("change", () => {
        setCameraPermission(permission.state);
      });

      if (permission.state === "granted") {
        await startCamera();
      } else if (permission.state === "prompt") {
        setCameraPermission("prompt");
      } else {
        setCameraError("Permiso de cámara denegado");
        setShowManualInput(true);
      }
    } catch {
      await startCamera();
    }
  }

  async function requestCameraPermission() {
    setCameraPermission("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      await startCamera();
    } catch {
      setCameraPermission("denied");
      setCameraError("Permiso de cámara denegado");
      setShowManualInput(true);
    }
  }

  async function startCamera() {
    let mounted = true;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          if (!mounted || processingRef.current) return;
          processingRef.current = true;
          await handleQRScan(decodedText);
          setTimeout(() => {
            processingRef.current = false;
          }, 2000);
        },
        () => {},
      );

      setCameraError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      if (
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Permission")
      ) {
        setCameraError("Permiso de cámara denegado");
        setCameraPermission("denied");
      } else if (errorMessage.includes("NotFoundError")) {
        setCameraError("No se encontró una cámara");
      } else if (errorMessage.includes("NotReadableError")) {
        setCameraError("La cámara está en uso por otra aplicación");
      } else {
        setCameraError("No se pudo acceder a la cámara");
      }

      setShowManualInput(true);
    }

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }

  async function handleQRScan(code: string) {
    if (!code.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await scanQR(code.trim(), userId);

      if (result.success && result.data) {
        setLastResult({
          success: true,
          guest: result.data.guest,
          event: result.data.request.event,
          table: result.data.request.table,
          package: result.data.request.package,
          scannedBy: result.data.scannedBy,
          usedAt: result.data.usedAt,
        });
      } else {
        setLastResult({
          success: false,
          guest: result.data?.guest || {
            name: "Desconocido",
            identityCard: "",
          },
          event: result.data?.request.event || {
            name: "",
            eventDate: new Date(),
          },
          table: result.data?.request.table || {
            name: "",
            sector: { name: "" },
          },
          package: result.data?.request.package || { name: "" },
          errorMessage: result.error,
          errorCode: result.code,
          ...(result.data?.scannedBy && { scannedBy: result.data.scannedBy }),
          ...(result.data?.usedAt && { usedAt: result.data.usedAt }),
        });
      }
    } catch {
      setLastResult({
        success: false,
        guest: { name: "Error", identityCard: "" },
        event: { name: "", eventDate: new Date() },
        table: { name: "", sector: { name: "" } },
        package: { name: "" },
        errorMessage: "Error inesperado al procesar el código",
        errorCode: "UNKNOWN_ERROR",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleQRScan(manualCode);
    setManualCode("");
    manualInputRef.current?.focus();
  }

  function toggleManualInput() {
    setShowManualInput(!showManualInput);
    if (!showManualInput) {
      setTimeout(() => manualInputRef.current?.focus(), 100);
    }
  }

  if (!isHttps) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Para usar la cámara, la aplicación debe estar en HTTPS. Por favor,
            accede desde la URL de producción o usa el modo manual.
          </AlertDescription>
        </Alert>

        <div className="bg-background rounded-lg p-4 border">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <Input
              ref={manualInputRef}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ingresa el código QR"
              className="text-base h-12"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full h-12"
              disabled={!manualCode.trim() || isProcessing}
            >
              Validar Código
            </Button>
          </form>
        </div>

        {lastResult && <QRScanResult result={lastResult} />}
      </div>
    );
  }

  if (cameraPermission === "prompt") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
        <Camera className="h-24 w-24 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Permiso de Cámara Requerido</h3>
          <p className="text-muted-foreground max-w-md">
            Para escanear códigos QR necesitamos acceso a tu cámara.
          </p>
        </div>
        <Button
          size="lg"
          onClick={requestCameraPermission}
          className="h-12 px-8"
        >
          Permitir Acceso a Cámara
        </Button>
        <Button variant="outline" onClick={() => setShowManualInput(true)}>
          Usar Modo Manual
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div
        className="relative bg-black rounded-t-lg overflow-hidden"
        style={{ flex: "0 0 60%" }}
      >
        <div id="qr-reader" className="w-full h-full" />

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center space-y-4">
            <Camera className="h-16 w-16 opacity-50" />
            <div className="space-y-2">
              <p className="font-semibold">{cameraError}</p>
              {cameraPermission === "denied" && (
                <p className="text-sm text-gray-300">
                  Ve a la configuración de tu navegador para habilitar el
                  permiso de cámara
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowManualInput(true)}
              className="mt-4"
            >
              Usar Modo Manual
            </Button>
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-10">
          <Button
            size="icon"
            variant={showManualInput ? "default" : "secondary"}
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={toggleManualInput}
          >
            <KeyboardIcon className="h-6 w-6" />
          </Button>
        </div>

        {showManualInput && (
          <div className="absolute bottom-20 left-4 right-4 z-10 bg-background rounded-lg p-4 shadow-xl border">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                ref={manualInputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Código QR"
                className="flex-1 h-12 text-base"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={!manualCode.trim() || isProcessing}
                className="h-12"
              >
                {isProcessing ? "..." : "Validar"}
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="overflow-auto" style={{ flex: "0 0 40%" }}>
        {lastResult ? (
          <QRScanResult result={lastResult} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Apunta la cámara a un código QR
          </div>
        )}
      </div>
    </div>
  );
}
