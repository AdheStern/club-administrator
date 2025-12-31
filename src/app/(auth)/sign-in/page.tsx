// src/app/(auth)/sign-in/page.tsx

import { AuthLayout } from "@/components/auth/shared/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";

/**
 * Página de inicio de sesión
 * Utiliza AuthLayout para mantener consistencia visual
 */

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
