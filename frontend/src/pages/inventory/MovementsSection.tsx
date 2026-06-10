import { SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { ensureProducts, getProduct } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { StockMovement } from "@/types/domain"
import { formatDate } from "@/lib/utils.ts"

export function MovementsSection() {
  const [movements, setMovements] = useState<StockMovement[]>([])

  console.log("Productos en cache:", getProduct(movements[0]?.productId ?? 0))

  useEffect(() => {
    async function load() {
      await ensureProducts()
      const movements = await apiClients.fetchMovements()
      setMovements(movements)
    }

    load().catch(() => {})
  }, [])

  return (
    <SectionCard title="Historial de movimientos">
      <div className="grid gap-2">
        {/*todo Corregir slice más tarde */}
        {movements
          // .slice()
          .reverse()
          .map((movement) => (
            <div
              className="grid gap-1 rounded-md border bg-neutral-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
              key={movement.id}
            >
              <div>
                <p className="font-medium">
                  <span className="">
                    {getProduct(movement.productId)?.name}
                  </span>
                  {movement.description && (
                    <>
                      <span className="text-neutral-500"> • </span>
                      <span>{movement.description}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(movement.date)}
                </p>
              </div>
              <StatusBadge
                tone={
                  movement.movementType === "MERMA"
                    ? "red"
                    : movement.movementType === "ENTRADA"
                      ? "green"
                      : "yellow"
                }
              >
                {movement.movementType} {movement.quantity}
              </StatusBadge>
            </div>
          ))}
      </div>
    </SectionCard>
  )
}
