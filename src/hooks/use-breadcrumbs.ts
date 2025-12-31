// src/hooks/use-breadcrumbs.ts

"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { getRouteLabel } from "@/config/routes.config";
import type { BreadcrumbItem } from "@/types/navigation.types";

/**
 * Hook personalizado que genera breadcrumbs dinámicos basados en la ruta actual
 * Implementa el patrón Strategy para diferentes estrategias de generación de breadcrumbs
 */
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const pathname = usePathname();

  return useMemo(() => {
    return generateBreadcrumbs(pathname);
  }, [pathname]);
};

/**
 * Genera la lista de breadcrumbs a partir de un pathname
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let accumulatedPath = "";

  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      label: getRouteLabel(segment),
      href: accumulatedPath,
      isCurrentPage: isLast,
    });
  });

  return breadcrumbs;
};
