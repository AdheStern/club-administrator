// src/app/(system)/sectors/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SectorContainer } from "@/components/system/sectors/sector-container";
import { auth } from "@/lib/auth";

export default async function SectorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <SectorContainer />;
}
