// src/app/(system)/requests/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RequestContainer } from "@/components/system/requests/request-container";
import { auth } from "@/lib/auth";

export default async function RequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <RequestContainer
      userId={session.user.id}
      userRole={session.user.role || ""}
    />
  );
}
