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
