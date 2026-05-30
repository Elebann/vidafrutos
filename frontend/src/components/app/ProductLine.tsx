import { getMissingUnits, getProduct } from "@/lib/dataCache"
import { StatusBadge } from "@/components/app/status-badge"

interface ProductLineProps {
  productId: number
  quantity: number
}

export function ProductLine({ productId, quantity }: ProductLineProps) {
  const product = getProduct(productId)
  const missing = getMissingUnits(productId, quantity)

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{product?.name}</p>
        <p className="text-xs text-muted-foreground">{quantity} unidades solicitadas</p>
      </div>
      {missing > 0 ? <StatusBadge tone="red">Faltan {missing}</StatusBadge> : <StatusBadge tone="green">Disponible</StatusBadge>}
    </div>
  )
}
