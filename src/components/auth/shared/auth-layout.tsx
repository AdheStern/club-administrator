// src/components/auth/shared/auth-layout.tsx

import { AuthLogo } from "@/components/auth/shared/auth-logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout reutilizable para páginas de autenticación
 * Implementa el patrón Template Method para estructura consistente
 * Proporciona grid responsivo con panel decorativo
 */

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <AuthLogo />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block"></div>
    </div>
  );
}
