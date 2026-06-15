import { Archive, Boxes } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { getProduct } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import { ensureProducts } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { PackagedStock, RawStock } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"

export function InventoryPage() {
  const [packagedStock, setPackagedStock] = useState<PackagedStock[]>([])
  const [rawStock, setRawStock] = useState<RawStock[]>([])

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
      } catch {
        // keep page usable even if one request fails
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageShell action={{ icon: Archive, label: "Actualizar inventario", to: "/inventario/actualizar" }} description="Stock envasado, materia prima y trazabilidad de movimientos." icon={Boxes} title="Inventario">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Stock envasado">
          <div className="grid gap-3 sm:grid-cols-2">
                        {packagedStock.map((stock) => {
              const product = getProduct(stock.productId)

              const critical = stock.availableStock <= stock.minimumStock
              const warningStock = stock.minimumStock * 1.3
              const warning = !critical && stock.availableStock <= warningStock

              return (
                <div className="rounded-lg border bg-white p-4" key={stock.productId}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="font-semibold">{product?.name}</p>

                    <StatusBadge
                      tone={
                        critical
                          ? "red"
                          : warning
                          ? "yellow"
                          : "green"
                      }
                    >
                      {critical
                        ? "Crítico"
                        : warning
                        ? "Advertencia"
                        : "OK"}
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
            {rawStock.map((stock) => <ProductLine key={stock.productId} productId={stock.productId} quantity={Math.round(stock.totalGrams)} variant="inventory" />)}
          </div>
        </SectionCard>
      </div>

    </PageShell>
  )
}
