// src/components/navigation/site-header.tsx
"use client";

import { CameraIcon, SidebarIcon } from "lucide-react";
import Link from "next/link";
import { DynamicBreadcrumbs } from "@/components/navigation/dynamic-breadcrumbs";
import { SearchForm } from "@/components/navigation/search-form";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

const CAMERA_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "VALIDATOR"];

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { data: session } = useSession();

  const userRole = session?.user?.role || "USER";
  const canAccessCamera = CAMERA_ALLOWED_ROLES.includes(userRole);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-14 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0"
        >
          <SidebarIcon className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <DynamicBreadcrumbs />

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* <SearchForm /> */}
          <Separator orientation="vertical" className="h-6" />
          {canAccessCamera && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/qr-validator">
                  <CameraIcon className="h-5 w-5" />
                  <span className="sr-only">QR Validator</span>
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
