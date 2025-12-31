// src/app/(auth)/sign-up/page.tsx

import { AuthLayout } from "@/components/auth/shared/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

/**
 * Página de registro
 * Utiliza AuthLayout para mantener consistencia visual
 */

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
