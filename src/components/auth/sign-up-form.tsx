// src/components/auth/sign-up-form.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthFormContainer } from "@/components/auth/shared/auth-form-container";
import {
  type SignUpFormData,
  signUpFormSchema,
} from "@/components/auth/shared/auth-schemas";
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
import { signUpUser } from "@/server/users";

interface SignUpFormProps extends React.ComponentProps<"form"> {}

/**
 * Formulario de registro
 * Refactorizado aplicando principios SOLID:
 * - SRP: Responsabilidades divididas en componentes más pequeños
 * - OCP: Abierto para extensión mediante composición
 * - DIP: Depende de abstracciones (hooks, schemas compartidos)
 */

// biome-ignore lint/correctness/noUnusedFunctionParameters: props puede ser utilizado en el futuro
export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
    mode: "onChange",
  });

  const { isLoading, handleSubmit } = useAuthSubmit(signUpUser);

  const onSubmit = async (values: SignUpFormData) => {
    await handleSubmit(values.email, values.password, values.username);
  };

  return (
    <AuthFormContainer
      title="Crea tu cuenta"
      description="Ingresa tus datos para registrarte"
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar sesión"
      footerLinkHref="/sign-in"
      className={className}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Adhemar"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="adhemar@mail.com"
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
              "Registrarse"
            )}
          </Button>
        </form>
      </Form>
    </AuthFormContainer>
  );
}
