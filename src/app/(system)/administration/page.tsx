// src/app/(system)/administration/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdministrationContainer } from "@/components/administration/administration-container";
import { auth } from "@/lib/auth";

export default async function AdministrationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <AdministrationContainer userId={session.user.id} />;
}
