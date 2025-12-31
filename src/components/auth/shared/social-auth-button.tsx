// src/components/auth/shared/social-auth-button.tsx

import { GoogleIcon } from "@/components/auth/shared/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type SocialProvider = "google";

interface SocialAuthButtonProps {
  provider: SocialProvider;
  callbackURL?: string;
}

/**
 * Configuración de proveedores sociales
 * Implementa el patrón Strategy para manejar diferentes proveedores
 */

const PROVIDER_CONFIG: Record<
  SocialProvider,
  {
    icon: React.ComponentType;
    label: string;
  }
> = {
  google: {
    icon: GoogleIcon,
    label: "Google",
  },
};

/**
 * Botón de autenticación social reutilizable
 * Aplica el principio Open/Closed: abierto para extensión (nuevos proveedores), cerrado para modificación
 */
export function SocialAuthButton({
  provider,
  callbackURL = "/aspire",
}: SocialAuthButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;

  const handleSocialAuth = async () => {
    await authClient.signIn.social({
      provider,
      callbackURL,
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleSocialAuth}
      type="button"
    >
      <Icon />
      {config.label}
    </Button>
  );
}
