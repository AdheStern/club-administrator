"use client";

import {
  AppWindowIcon,
  CommandIcon,
  type LucideIcon,
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

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  requiredRoles?: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Sectores",
    url: "/sectors",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Mesas",
    url: "/tables",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Paquetes",
    url: "/packages",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Eventos",
    url: "/events",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Reservas",
    url: "/requests",
    icon: AppWindowIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPERVISOR", "USER"],
  },
  {
    title: "Administración",
    url: "/administration",
    icon: UsersIcon,
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
];

interface RoleAccessStrategy {
  canAccess(userRole: string, requiredRoles?: string[]): boolean;
}

class DefaultAccessStrategy implements RoleAccessStrategy {
  canAccess(userRole: string, requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    return requiredRoles.includes(userRole);
  }
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: string;
}

export function AppSidebar({ userRole = "USER", ...props }: AppSidebarProps) {
  const accessStrategy = new DefaultAccessStrategy();
  const filteredNavItems = navItems.filter((item) =>
    accessStrategy.canAccess(userRole, item.requiredRoles),
  );

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
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
