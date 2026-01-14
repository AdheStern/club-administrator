// src/app/(system)/events/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EventContainer } from "@/components/system/events/event-container";
import { auth } from "@/lib/auth";

export default async function EventsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <EventContainer />;
}
