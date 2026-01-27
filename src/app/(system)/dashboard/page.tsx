// src/app/(system)/dashboard/page.tsx

import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { DashboardContainer } from "@/components/system/dashboard/dashboard-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDashboardData } from "@/lib/actions/dashboard-actions";

export const metadata: Metadata = {
  title: "Dashboard | Club Administrator",
  description: "Panel de control y estadísticas del sistema",
};

export default async function DashboardPage() {
  const result = await getDashboardData();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Vista general del sistema y métricas principales
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "No se pudo cargar la información del dashboard"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vista general del sistema y métricas principales
        </p>
      </div>

      <DashboardContainer
        initialData={result.data}
        getDashboardDataAction={getDashboardData}
      />
    </div>
  );
}
