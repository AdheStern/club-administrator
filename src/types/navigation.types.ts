// src/types/navigation.types.ts

/**
 * Representa un elemento individual del breadcrumb
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

/**
 * Configuración de mapeo de rutas a labels personalizados
 */
export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType;
}
