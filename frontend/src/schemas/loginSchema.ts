import { z } from "zod";

export const loginSchema = z.object({
  rut: z
    .string()
    .min(1, { message: "El RUT es requerido" })
    .regex(/^\d{1,8}-[\dkK]$/, {
      message: "El RUT debe tener el formato correcto (Ej. 12345678-9)",
    }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida" })
    .min(4, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
