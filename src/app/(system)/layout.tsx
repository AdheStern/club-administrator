// src/app/(system)/layout.tsx

import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/navigation/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AlpacaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col p-4">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </main>
  );
}
