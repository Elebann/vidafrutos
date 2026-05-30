import { Archive, Boxes } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { getProduct } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { PackagedStock, RawStock } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import { MovementsSection } from "./MovementsSection"

export function InventoryPage() {
  const [packagedStock, setPackagedStock] = useState<PackagedStock[]>([])
  const [rawStock, setRawStock] = useState<RawStock[]>([])

  useEffect(() => {
    apiClients.fetchPackagedStock().then(setPackagedStock).catch(() => {})
    apiClients.fetchRawStock().then(setRawStock).catch(() => {})
  }, [])

  return (
    <PageShell action={{ icon: Archive, label: "Actualizar inventario", to: "/inventario/actualizar" }} description="Stock envasado, materia prima y trazabilidad de movimientos." icon={Boxes} title="Inventario">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Stock envasado">
          <div className="grid gap-3 sm:grid-cols-2">
            {packagedStock.map((stock) => {
              const product = getProduct(stock.productId)
              const critical = stock.availableStock <= stock.minimumStock
              return (
                <div className="rounded-lg border bg-white p-4" key={stock.productId}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="font-semibold">{product?.name}</p>
                    <StatusBadge tone={critical ? "red" : "green"}>{critical ? "Critico" : "OK"}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><strong>{stock.availableStock}</strong><span className="block text-xs text-muted-foreground">Disp.</span></div>
                    <div><strong>{stock.allocatedStock}</strong><span className="block text-xs text-muted-foreground">Reserv.</span></div>
                    <div><strong>{stock.minimumStock}</strong><span className="block text-xs text-muted-foreground">Min.</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
        <SectionCard title="Materia prima">
          <div className="grid gap-2">
            {rawStock.map((stock) => <ProductLine key={stock.productId} productId={stock.productId} quantity={Math.round(Number(stock.quantityKilogram))} />)}
          </div>
        </SectionCard>
      </div>
      <MovementsSection />
    </PageShell>
  )
}
