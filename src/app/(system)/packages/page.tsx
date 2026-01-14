// src/app/(system)/packages/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PackageContainer } from "@/components/system/packages/package-container";
import { auth } from "@/lib/auth";

export default async function PackagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <PackageContainer />;
}
