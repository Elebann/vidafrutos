import { getMissingUnits, getProduct } from "@/lib/dataCache"
import { StatusBadge } from "@/components/app/status-badge"
import { AlertTriangle } from "lucide-react"

interface ProductLineProps {
  productId: number
  quantity: number
  variant?: "order" | "inventory"
  lowStock?: boolean
  paquetesPosibles?: number
}

export function ProductLine({ productId, quantity, variant = "order", lowStock, paquetesPosibles }: ProductLineProps) {
  const product = getProduct(productId)

  if (variant === "inventory") {
    const kg = quantity / 1000
    return (
      <div className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${lowStock ? "border border-red-200 bg-red-50" : "bg-neutral-50"}`}>
        <div className="min-w-0">
          <p className="truncate font-medium">{product?.name}</p>
          <p className="text-xs text-muted-foreground">{kg % 1 === 0 ? kg : kg.toFixed(1)} kg</p>
        </div>
        {lowStock && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Solo {paquetesPosibles} paquetes</span>
          </div>
        )}
      </div>
    )
  }

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
