import { Archive, Boxes } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { getProduct } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import { ensureProducts } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { PackagedStock, RawStock } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import { useInventoryAlerts } from "@/contexts/inventory-alert-context"


export function InventoryPage() {
  const [packagedStock, setPackagedStock] = useState<PackagedStock[]>([])
  const [rawStock, setRawStock] = useState<RawStock[]>([])
  const { setLowStockProducts } = useInventoryAlerts()

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await ensureProducts()
        if (cancelled) return

        const [packaged, raw] = await Promise.all([apiClients.fetchPackagedStock(), apiClients.fetchRawStock()])
        if (cancelled) return

        setPackagedStock(packaged)
        setRawStock(raw)

        const lowStock = raw
          .filter((s) => {
            const product = getProduct(s.productId)
            return product?.active !== false
          })
          .map((s) => {
            const product = getProduct(s.productId)
            if (!product) return null
            const paquetesPosibles = Math.floor(s.totalGrams / product.grams)
            return {
              productName: product.name,
              kgDisponible: s.totalGrams / 1000,
              gramsRequeridos: product.grams,
              paquetesPosibles,
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null && item.paquetesPosibles < 100)

        setLowStockProducts(lowStock)
      } catch {
        // keep page usable even if one request fails
      }
    })()

    return () => {
      cancelled = true
    }
  }, [setLowStockProducts])

  return (
    <PageShell action={{ icon: Archive, label: "Actualizar inventario", to: "/inventario/actualizar" }} description="Stock envasado, materia prima y trazabilidad de movimientos." icon={Boxes} title="Inventario">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Stock envasado">
          <div className="grid gap-3 sm:grid-cols-2">
            {packagedStock
              .filter((stock) => stock.product.active) // solo mostrar productos activos
              .map((stock) => {
                const product = getProduct(stock.productId)
                const critical = stock.availableStock <= stock.minimumStock
                const warningStock = stock.minimumStock * 1.3
                const warning =
                  !critical && stock.availableStock <= warningStock

                return (
                  <div
                    className="rounded-lg border bg-white p-4"
                    key={stock.productId}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="font-semibold">{product?.name}</p>

                      <StatusBadge
                        tone={critical ? "red" : warning ? "yellow" : "green"}
                      >
                        {critical ? "Crítico" : warning ? "Advertencia" : "OK"}
                      </StatusBadge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <strong>{stock.availableStock}</strong>
                        <span className="block text-xs text-muted-foreground">
                          Envasado
                        </span>
                      </div>
                      <div>
                        <strong>{stock.allocatedStock}</strong>
                        <span className="block text-xs text-muted-foreground">
                          Reserv.
                        </span>
                      </div>
                      <div>
                        <strong>{stock.minimumStock}</strong>
                        <span className="block text-xs text-muted-foreground">
                          Min.
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </SectionCard>
        <SectionCard title="Materia prima">
          <div className="grid gap-2">
            {rawStock
              .filter((stock) => {
                const product = getProduct(stock.productId)
                return product?.active !== false
              })
              .map((stock) => {
                const product = getProduct(stock.productId)
                const paquetesPosibles = product ? Math.floor(stock.totalGrams / product.grams) : 0
                const lowStock = paquetesPosibles < 100

                return (
                  <ProductLine
                    key={stock.productId}
                    productId={stock.productId}
                    quantity={Math.round(stock.totalGrams)}
                    variant="inventory"
                    lowStock={lowStock}
                    paquetesPosibles={paquetesPosibles}
                  />
                )
              })}
          </div>
        </SectionCard>
      </div>

    </PageShell>
  )
}
