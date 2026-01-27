// src/components/auth/shared/auth-form-container.tsx

import Link from "next/link";
import { SocialAuthButton } from "@/components/auth/shared/social-auth-button";
import { cn } from "@/lib/utils";

interface AuthFormContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  className?: string;
}

/**
 * Contenedor de formulario de autenticación reutilizable
 * Implementa el patrón Template Method: define la estructura común de los formularios de auth
 */

export function AuthFormContainer({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
  className,
}: AuthFormContainerProps) {
  return (
    <main className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {description}
        </p>
      </div>

      {children}

      <div className="text-center text-sm">
        {footerText}{" "}
        <Link
          href={footerLinkHref}
          className="hover:underline underline-offset-4"
        >
          {footerLinkText}
        </Link>
      </div>
    </main>
  );
}
