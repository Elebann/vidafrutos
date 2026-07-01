import { z } from "zod"

export const lettersSpaces20Schema = z
  .string()
  .max(20, "Máximo 20 caracteres")
  .regex(/^[a-zA-Z ]*$/, "Solo se permiten letras y espacios")

export const lettersNumbersSpaces20Schema = z
  .string()
  .max(20, "Máximo 20 caracteres")
  .regex(/^[a-zA-Z0-9 ]*$/, "Solo se permiten letras, números y espacios")

export const lettersSpaces50Schema = z
  .string()
  .min(1, "El usuario es requerido")
  .max(50, "Máximo 50 caracteres")
  .regex(/^[a-zA-Z ]+$/, "Solo se permiten letras y espacios")

export const lettersSpaces100Schema = z
  .string()
  .max(100, "Máximo 100 caracteres")
  .regex(/^[a-zA-Z ]*$/, "Solo se permiten letras y espacios")

export const digits10Schema = z
  .string()
  .max(10, "Máximo 10 dígitos")
  .regex(/^\d*$/, "Solo se permiten números")

export function getValidationMessage(schema: z.ZodType<string>, value: string) {
  const result = schema.safeParse(value)
  return result.success ? "" : result.error.issues[0]?.message ?? "Valor inválido"
}
