// src/components/auth/shared/auth-schemas.ts

import { z } from "zod";

/**
 * Validación reutilizable para campo de email
 */
export const emailSchema = z
  .string()
  .min(3, { message: "El correo debe tener al menos 3 caracteres." })
  .max(50, { message: "El correo no debe exceder los 50 caracteres." })
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message:
      "El correo debe tener un formato válido (ejemplo: usuario@mail.com).",
  })
  .refine((val) => !/['";<>]/.test(val), {
    message: "El correo no debe contener caracteres especiales como ' ; < >",
  });

/**
 * Validación reutilizable para campo de contraseña
 */
export const passwordSchema = z
  .string()
  .max(50, { message: "La contraseña no debe exceder los 50 caracteres." });

/**
 * Validación reutilizable para campo de nombre de usuario
 */
export const usernameSchema = z
  .string()
  .min(3, { message: "El nombre debe tener al menos 3 caracteres." })
  .max(30, { message: "El nombre no debe exceder los 30 caracteres." })
  .refine((val) => !/['";<>]/.test(val), {
    message:
      "El nombre de usuario no debe contener caracteres especiales como ' ; < >",
  });

/**
 * Esquema de validación para formulario de inicio de sesión
 */
export const signInFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Esquema de validación para formulario de registro
 */
export const signUpFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});

export type SignInFormData = z.infer<typeof signInFormSchema>;
export type SignUpFormData = z.infer<typeof signUpFormSchema>;
