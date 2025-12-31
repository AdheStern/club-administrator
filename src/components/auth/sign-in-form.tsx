// src/components/auth/sign-in-form.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthFormContainer } from "@/components/auth/shared/auth-form-container";
import { PasswordField } from "@/components/auth/shared/password-field";
import { useAuthSubmit } from "@/components/auth/shared/use-auth-submit";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInUser } from "@/server/users";
import { type SignInFormData, signInFormSchema } from "./shared/auth-schemas";

interface SignInFormProps extends React.ComponentProps<"form"> {}

/**
 * Formulario de inicio de sesión
 * Refactorizado aplicando principios SOLID:
 * - SRP: Responsabilidades divididas en componentes más pequeños
 * - OCP: Abierto para extensión mediante composición
 * - DIP: Depende de abstracciones (hooks, schemas compartidos)
 */

// biome-ignore lint/correctness/noUnusedFunctionParameters: props puede ser utilizado en el futuro
export function SignInForm({ className, ...props }: SignInFormProps) {
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const { isLoading, handleSubmit } = useAuthSubmit(signInUser);

  const onSubmit = async (values: SignInFormData) => {
    await handleSubmit(values.email, values.password);
  };

  return (
    <AuthFormContainer
      title="Ingresa a tu cuenta"
      description="Ingresa tu email y contraseña para continuar"
      footerText="¿No tienes una cuenta?"
      footerLinkText="Registrarse"
      footerLinkHref="/sign-up"
      className={className}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@mail.com"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <PasswordField field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full hover:bg-green-500 font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
      </Form>
    </AuthFormContainer>
  );
}
