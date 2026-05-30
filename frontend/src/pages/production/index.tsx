import { Factory } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { forecasts } from "@/data/mock-data"
import { useEffect } from "react"
import { ensureProducts, ensurePackagedStock } from "@/lib/dataCache"
import { ProductLine } from "@/components/app/ProductLine"
import { MovementsSection } from "@/pages/inventory/MovementsSection"

export function ProductionPage() {
  useEffect(() => {
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
  }, [])
  const suggestions = forecasts.filter((forecast) => forecast.suggestedProduction > 0)
  return (
    <PageShell action={{ icon: Factory, label: "Registrar produccion", to: "/produccion/registrar" }} description="Planificacion diaria basada en faltantes y demanda esperada." icon={Factory} title="Produccion">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Sugerencias de produccion">
          <div className="grid gap-2">
            {suggestions.map((forecast) => <ProductLine key={forecast.productId} productId={forecast.productId} quantity={forecast.suggestedProduction} />)}
          </div>
        </SectionCard>
        <MovementsSection />
      </div>
    </PageShell>
  )
}
