"use client";

import {
  AppWindowIcon,
  CommandIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavUser } from "@/components/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: AppWindowIcon,
    },
    {
      title: "Sectores",
      url: "/sectors",
      icon: AppWindowIcon,
    },
    {
      title: "Mesas",
      url: "/tables",
      icon: AppWindowIcon,
    },
    {
      title: "Paquetes",
      url: "/packages",
      icon: AppWindowIcon,
    },
    {
      title: "Eventos",
      url: "/events",
      icon: AppWindowIcon,
    },
    {
      title: "Reservas",
      url: "/requests",
      icon: AppWindowIcon,
    },
    {
      title: "Administración",
      url: "/administration",
      icon: UsersIcon,
    },
    {
      title: "Configuraciones",
      url: "/settings",
      icon: SettingsIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CommandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">JET CLUB</span>
                  <span className="truncate text-xs">Reservas</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
