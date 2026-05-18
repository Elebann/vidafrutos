import { BarChart3 } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { KpiCard } from "@/components/app/kpi-card"

export function ReportsPage() {
  return (
    <PageShell description="Indicadores para medir mejoras operacionales del proyecto." icon={BarChart3} title="Reportes">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard detail="Meta del informe: sobre 90%." icon={BarChart3} label="Exactitud inventario" tone="success" value="93%" />
        <KpiCard detail="Tiempo promedio simulado de armado." icon={BarChart3} label="Preparacion" value="42 min" />
        <KpiCard detail="Eventos de stock bajo del periodo." icon={BarChart3} label="Quiebres" tone="danger" value="4" />
        <KpiCard detail="Pedidos finalizados a tiempo." icon={BarChart3} label="Despachos OK" tone="success" value="91%" />
      </div>
      <SectionCard title="Lectura rapida">
        <div className="grid gap-2 text-sm text-neutral-700">
          <p>Las ventas se concentran en mani sin sal y mani salado, por lo que sus umbrales deben mantenerse sobre 200 unidades.</p>
          <p>Los quiebres proyectados vienen principalmente desde productos con baja rotacion que se producen tarde.</p>
          <p>La preparacion mejora cuando los pedidos quedan validados antes del cierre del dia anterior.</p>
        </div>
      </SectionCard>
    </PageShell>
  )
}