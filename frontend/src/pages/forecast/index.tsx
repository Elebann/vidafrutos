import { Factory } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { KpiCard } from "@/components/app/kpi-card"
import { StatusBadge, type BadgeTone } from "@/components/app/status-badge"
import { getProduct, ensureProducts } from "@/lib/dataCache"
import { useEffect } from "react"
import type { Forecast } from "@/types/domain"

function riskTone(risk: string): BadgeTone {
  if (risk === "Alto") return "red"
  if (risk === "Medio") return "yellow"
  return "green"
}

export function ForecastPage() {
  const forecasts: Forecast[] = []

  useEffect(() => {
    ensureProducts().catch(() => {})
    // apiClients.fetchForecasts().then(setForecasts).catch(() => {})
  }, [])
  return (
    <PageShell description="Pronostico simulado alimentado por ventas historicas y pedidos recientes." icon={Factory} title="Prediccion IA">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard detail="Promedio de los productos evaluados." icon={Factory} label="Confianza promedio" tone="success" value="82%" />
        <KpiCard detail="Productos con riesgo alto de quiebre." icon={Factory} label="Riesgo alto" tone="danger" value="2" />
        <KpiCard detail="Unidades sugeridas para producir." icon={Factory} label="Produccion sugerida" tone="warning" value="500" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {forecasts.map((forecast) => {
          const product = getProduct(forecast.productId)
          return (
            <SectionCard key={forecast.productId}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">{product?.name}</h2><p className="text-sm text-muted-foreground">Ventas esperadas: {forecast.expectedSales} unidades</p></div>
                <StatusBadge tone={riskTone(forecast.risk)}>Riesgo {forecast.risk}</StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-neutral-50 p-3"><strong>{forecast.suggestedProduction}</strong><span className="block text-muted-foreground">Producir</span></div>
                <div className="rounded-md bg-neutral-50 p-3"><strong>{forecast.confidence}%</strong><span className="block text-muted-foreground">Confianza</span></div>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </PageShell>
  )
}
