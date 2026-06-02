import { z } from "zod"
import { createRutSchema } from "rut-kit/zod"

const rut = createRutSchema({
  messages: {
    required: "El RUT es requerido",
    invalidFormat: "El RUT debe tener el formato correcto (Ej. 12345678-9)",
    invalidCheckDigit: "El dígito verificador del RUT no es válido",
  },
})

export const userSchema = z.object({
  rut,
  username: z
    .string()
    .min(1, { message: "El usuario es requerido" })
    .regex(/^\S+$/, { message: "El usuario no puede contener espacios" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  rol: z
    .string()
    .min(1, { message: "Debes seleccionar un rol" }),
})

export type UserFormData = z.infer<typeof userSchema>
