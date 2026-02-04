// src/app/(system)/dashboard/page.tsx
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContainer } from "@/components/system/dashboard/dashboard-container";
import { WelcomeMessage } from "@/components/system/dashboard/welcome-message";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDashboardData } from "@/lib/actions/dashboard-actions";
import { auth } from "@/lib/auth";
import { checkPermission, type UserRole } from "@/lib/utils/permissions";

export const metadata: Metadata = {
  title: "Dashboard | Club Administrator",
  description: "Panel de control y estadísticas del sistema",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userRole = session.user.role ?? "USER";
  const canViewAnalytics = checkPermission(
    userRole as UserRole,
    "VIEW_DASHBOARD_ANALYTICS",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vista general del sistema y métricas principales
        </p>
      </div>

      {!canViewAnalytics ? (
        <WelcomeMessage userName={session.user.name} userRole={userRole} />
      ) : (
        <DashboardAnalytics />
      )}
    </div>
  );
}

async function DashboardAnalytics() {
  const result = await getDashboardData();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.error || "No se pudo cargar la información del dashboard"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DashboardContainer
      initialData={result.data}
      getDashboardDataAction={getDashboardData}
    />
  );
}
