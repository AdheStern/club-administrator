// src/app/page.tsx

import { ArrowRight, Calendar, CheckCircle, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              JET CLUB
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Sistema de Gestión de Reservas y Eventos
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/sign-in">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg">
                Iniciar Sesión
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {/* <Link href="/sign-up">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Crear Cuenta
              </Button>
            </Link> */}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-16 w-full max-w-5xl">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Gestión de Clientes</h3>
                <p className="text-muted-foreground">
                  Administra fácilmente la información de tus clientes y sus
                  reservas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold">Control de Eventos</h3>
                <p className="text-muted-foreground">
                  Organiza y gestiona eventos con múltiples sectores y mesas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold">Aprobación Rápida</h3>
                <p className="text-muted-foreground">
                  Sistema eficiente de revisión y aprobación de solicitudes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Badge */}
          <div className="pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Sistema Seguro y Confiable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 JET CLUB. Sistema de Gestión de Reservas.</p>
          <p className="mt-2">Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
