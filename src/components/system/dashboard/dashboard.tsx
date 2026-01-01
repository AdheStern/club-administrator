"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/actions/dashboard.actions";

// Definimos la interfaz localmente para evitar problemas de importación circular
interface DashboardData {
  stats: {
    totalTables: number;
    activeTables: number;
    totalEvents: number;
    totalReservations: number;
    pendingReservations: number;
  };
  recentReservations: {
    id: string;
    customerName: string;
    customerDoc: string;
    status: string;
  }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimizacion: useCallback para evitar re-creación de la función
  const loadDashboardData = useCallback(async () => {
    try {
      const result = await getDashboardStats();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error("No se pudieron cargar las estadísticas");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Calculando métricas del club...</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentReservations } = data;

  // Datos para el gráfico
  const chartData = [
    {
      name: "Aprobadas",
      cantidad: stats.totalReservations - stats.pendingReservations,
      fill: "#22c55e", // Green-500
    },
    {
      name: "Pendientes",
      cantidad: stats.pendingReservations,
      fill: "#eab308", // Yellow-500
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Mesas Totales" value={stats.totalTables} />
        <StatCard
          label="Mesas Activas"
          value={stats.activeTables}
          highlight
          description={`${Math.round(
            (stats.activeTables / (stats.totalTables || 1)) * 100
          )}% operativas`}
        />
        <StatCard label="Eventos" value={stats.totalEvents} />
        <StatCard label="Total Reservas" value={stats.totalReservations} />
        <StatCard
          label="Pendientes"
          value={stats.pendingReservations}
          variant="warning"
          description="Requieren atención"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Gráfico - Ocupa 4 columnas */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Estado de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lista Reciente - Ocupa 3 columnas */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Últimas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay actividad reciente
                </p>
              ) : (
                recentReservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {res.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {res.customerDoc}
                      </p>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Subcomponentes optimizados para legibilidad

function StatCard({
  label,
  value,
  highlight = false,
  variant = "default",
  description,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  variant?: "default" | "warning";
  description?: string;
}) {
  const variantStyles = {
    default: highlight ? "bg-primary/5 border-primary/20" : "bg-card",
    warning:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  };

  return (
    <Card
      className={`${variantStyles[variant]} transition-all hover:shadow-md`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    APPROVED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    OBSERVED:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    REJECTED:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    CANCELLED:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };

  const defaultStyle = "bg-gray-100 text-gray-800";

  return (
    <span
      className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
        styles[status] || defaultStyle
      }`}
    >
      {status}
    </span>
  );
}
