const HISTORY_FIELD_LABELS: Record<string, string> = {
  state: "Estado",
  customer: "Cliente",
  date: "Fecha",
  "detail.added": "Producto agregado",
  "detail.removed": "Producto eliminado",
  "detail.quantity": "Cantidad",
  "detail.price": "Precio",
  "detail.product": "Producto",
}

export function getHistoryFieldLabel(field: string): string {
  return HISTORY_FIELD_LABELS[field] ?? field
}
