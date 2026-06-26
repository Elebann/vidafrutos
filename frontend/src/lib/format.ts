export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    currency: "CLP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

export function getTodayLocalIsoDate(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-")
}

export function isIsoDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function ensureIsoDateOnly(value: string | null | undefined): string {
  if (isIsoDateOnly(value)) return value
  if (!value) return getTodayLocalIsoDate()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return getTodayLocalIsoDate()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-")
}

export function parseIsoDateOnly(value: string): Date | null {
  if (!isIsoDateOnly(value)) return null
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b)
}

export function formatDate(dateOnly: string | null | undefined): string {
  if (!dateOnly) return ""
  const d = parseIsoDateOnly(dateOnly)
  if (!d) return dateOnly
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = String(d.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

export function formatDateLong(dateOnly: string | null | undefined): string {
  if (!dateOnly) return ""
  const d = parseIsoDateOnly(dateOnly)
  if (!d) return dateOnly
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  })
}

export function formatDateTime(dateString: string | number | Date | null | undefined): string {
  if (dateString === null || dateString === undefined || dateString === "") return ""
  try {
    const d = dateString instanceof Date ? dateString : new Date(dateString)
    if (Number.isNaN(d.getTime())) return typeof dateString === "string" ? dateString : ""
    return d.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return typeof dateString === "string" ? dateString : ""
  }
}

export function formatDateTimeFromEpoch(
  seconds: number | null | undefined,
): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return ""
  return formatDateTime(new Date(seconds * 1000))
}

export const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "pdf"])
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Retorna "YYYY-MM" para agrupar/filtrar por mes.
 * Acepta date-only o datetime y siempre usa componentes locales de Chile.
 */
export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Verifica si una fecha pertenece al mismo mes que `reference` (por defecto: ahora).
 * Acepta date-only o datetime ISO.
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
