// src/config/routes.config.ts

/**
 * Configuración centralizada de rutas y sus labels
 * Permite mantener consistencia en la nomenclatura de rutas
 */
export const ROUTE_LABELS: Record<string, string> = {
  alpaca: "ALPACA",
  dashboard: "Dashboard",
  settings: "Configuraciones",
  users: "Usuarios",
};

/**
 * Obtiene el label personalizado de una ruta o devuelve el segmento formateado
 */
export const getRouteLabel = (segment: string): string => {
  return ROUTE_LABELS[segment] || formatSegment(segment);
};

/**
 * Formatea un segmento de URL para mostrarlo como label
 * Convierte kebab-case y snake_case a Title Case
 */
const formatSegment = (segment: string): string => {
  return segment
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
