// src/components/auth/shared/password-field.tsx

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface PasswordFieldProps {
  // biome-ignore lint/suspicious/noExplicitAny: No es necesario especificar tipos aquí
  field: ControllerRenderProps<any, "password">;
  placeholder?: string;
}

/**
 * Campo de contraseña reutilizable con funcionalidad de mostrar/ocultar
 * Implementa el patrón Composite para encapsular la lógica del toggle de visibilidad
 */
export function PasswordField({
  field,
  placeholder = "********",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...field}
        required
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? (
          <EyeOffIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
