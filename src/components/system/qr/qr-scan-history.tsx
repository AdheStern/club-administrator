// /src/components/system/qr/qr-scan-history.tsx

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRecentScans } from "@/lib/actions/qr-validation-actions";

interface RecentScan {
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
}

export function QRScanHistory() {
  const [scans, setScans] = useState<RecentScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScans();
    const interval = setInterval(loadScans, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadScans() {
    setIsLoading(true);
    try {
      const result = await getRecentScans(20);
      if (result.success && result.data) {
        setScans(result.data);
      }
    } catch (error) {
      console.error("Error loading scans:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escaneos Recientes</CardTitle>
        <CardDescription>Últimos 20 códigos QR escaneados</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando...
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay escaneos recientes
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitado</TableHead>
                <TableHead>CI</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Escaneado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">
                    {scan.guest.name}
                  </TableCell>
                  <TableCell>{scan.guest.identityCard}</TableCell>
                  <TableCell>
                    {new Date(scan.usedAt).toLocaleString("es-BO")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{scan.scannedBy.name}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
