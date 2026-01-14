// src/app/(system)/tables/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TableContainer } from "@/components/system/tables/table-container";
import { auth } from "@/lib/auth";

export default async function TablesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <TableContainer />;
}
