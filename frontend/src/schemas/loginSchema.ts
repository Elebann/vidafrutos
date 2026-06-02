import { z } from "zod"
import { createRutSchema } from "rut-kit/zod"

const rut = createRutSchema({
  messages: {
    required: "El RUT es requerido",
    invalidFormat: "El RUT debe tener el formato correcto (Ej. 12345678-5)",
    invalidCheckDigit: "El dígito verificador del RUT no es válido",
  },
})

export const loginSchema = z.object({
  rut,
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida" })
    .min(4, { message: "La contraseña debe tener al menos 6 caracteres" }),
})

export type LoginFormData = z.infer<typeof loginSchema>
