export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    currency: "CLP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ""
  try {
    return new Date(dateString).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString || ""
  }
}

export const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "pdf"])
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Retorna "YYYY-MM" para agrupar/filtrar por mes.
 */
export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Verifica si una fecha pertenece al mismo mes que `reference` (por defecto: ahora).
 */
export function isSameMonth(dateStr: string, reference: Date = new Date()): boolean {
  const d = new Date(dateStr)
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth()
}

/**
 * Filtra un arreglo manteniendo solo los ítems cuya fecha cae en el mes de `reference`.
 * `dateField` puede ser la clave del objeto o una función que retorne el string de fecha.
 */
export function filterByMonth<T>(
  items: T[],
  dateField: keyof T | ((item: T) => string),
  reference: Date = new Date()
): T[] {
  return items.filter((item) => {
    const raw = typeof dateField === "function" ? dateField(item) : (item[dateField] as string)
    return isSameMonth(raw, reference)
  })
}
