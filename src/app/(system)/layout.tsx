// src/app/(system)/layout.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/navigation/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar userRole={session.user.role ?? "USER"} />
          <SidebarInset>
            <div className="flex flex-1 flex-col p-4">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </main>
  );
}
