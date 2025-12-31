// src/components/auth/shared/use-auth-submit.tsx

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AuthResponse {
  success: boolean;
  message: string;
}

// biome-ignore lint/suspicious/noExplicitAny: No es necesario especificar tipos aquí
type AuthAction = (...args: any[]) => Promise<AuthResponse>;

/**
 * Hook personalizado para manejar la lógica común de autenticación
 * Aplica el principio DRY (Don't Repeat Yourself) y encapsula la lógica compartida
 */

export function useAuthSubmit(
  authAction: AuthAction,
  successRedirect: string = "/aspire"
) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // biome-ignore lint/suspicious/noExplicitAny: No es necesario especificar tipos aquí
  const handleSubmit = async (...args: any[]) => {
    setIsLoading(true);

    try {
      const { success, message } = await authAction(...args);

      if (success) {
        toast.success(message);
        router.push(successRedirect);
      } else {
        toast.error(message);
      }
      // biome-ignore lint/correctness/noUnusedVariables: Se imprime un error genérico
    } catch (error) {
      toast.error("Ha ocurrido un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
}
