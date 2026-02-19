// src/app/(system)/user-activity/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserActivityContainer } from "@/components/system/user-activity/user-activity-container";
import { auth } from "@/lib/auth";

export default async function UserActivityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <UserActivityContainer />;
}
