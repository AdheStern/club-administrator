// src/app/(system)/event-panel/page.tsx

import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EventPanelContainer } from "@/components/system/event-panel/event-panel-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEventOptions } from "@/lib/actions/event-panel-actions";
import { auth } from "@/lib/auth";
import { checkPermission, type UserRole } from "@/lib/utils/permissions";

export const metadata: Metadata = {
  title: "Panel de Evento | JET CLUB",
};

export default async function EventPanelPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/sign-in");

  const userRole = (session.user.role ?? "USER") as UserRole;
  const canView = checkPermission(userRole, "VIEW_EVENT_PANEL");

  if (!canView) redirect("/dashboard");

  const result = await getEventOptions();

  if (!result.success || !result.data) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error ?? "No se pudieron cargar los eventos"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-3 h-full">
      <EventPanelContainer events={result.data} />
    </div>
  );
}
