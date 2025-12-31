// src/components/auth/shared/auth-logo.tsx

import Link from "next/link";

interface AuthLogoProps {
  className?: string;
}

/**
 * Logo de la aplicación para páginas de autenticación
 * Componente reutilizable que mantiene consistencia visual
 */

// biome-ignore lint/correctness/noUnusedFunctionParameters: className puede ser utilizado en el futuro
export function AuthLogo({ className }: AuthLogoProps) {
  return (
    <div className="flex justify-center gap-2 md:justify-start">
      <Link
        href="/"
        className="flex items-center gap-2 font-2xl hover:text-green-500 transition-colors"
        style={{ fontFamily: "'Audiowide', sans-serif" }}
      >
        ALPACA
      </Link>
    </div>
  );
}
