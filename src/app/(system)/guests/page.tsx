// src/app/(system)/guests/page.tsx

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GuestContainer } from "@/components/system/guests/guest-container";
import { getGuests } from "@/lib/actions/guest-actions";
import { auth } from "@/lib/auth";
import { checkPermission, type UserRole } from "@/lib/utils/permissions";

export const metadata: Metadata = {
  title: "Clientes | JET CLUB",
  description: "Gestión de clientes registrados en el sistema",
};

export default async function GuestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  if (!checkPermission(session.user.role as UserRole, "MANAGE_GUESTS")) {
    redirect("/dashboard");
  }

  const result = await getGuests({}, { page: 1, pageSize: 1000 });
  const initialGuests = result.success && result.data ? result.data.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-1">
          Gestión del registro de clientes y su historial
        </p>
      </div>
      <GuestContainer initialGuests={initialGuests} />
    </div>
  );
}
