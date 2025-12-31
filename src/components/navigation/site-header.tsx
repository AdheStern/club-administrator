// src/components/navigation/site-header.tsx

"use client";

import { SidebarIcon } from "lucide-react";
import { DynamicBreadcrumbs } from "@/components/navigation/dynamic-breadcrumbs";
import { SearchForm } from "@/components/navigation/search-form";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-6 w-6"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DynamicBreadcrumbs />
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        <ModeToggle />
      </div>
    </header>
  );
}
