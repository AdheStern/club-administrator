// src/app/(system)/dashboard/page.tsx

import type { Metadata } from "next";
import { DashboardContainer } from "@/components/system/dashboard/dashboard-container";

export const metadata: Metadata = {
  title: "Dashboard | Club Administrator",
  description: "Panel de control y estadísticas del sistema",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vista general del sistema y métricas principales
        </p>
      </div>

      <DashboardContainer />
    </div>
  );
}
