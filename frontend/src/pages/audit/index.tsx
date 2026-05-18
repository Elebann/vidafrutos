import { FileClock } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { orders } from "@/data/mock-data"
import { MovementsSection } from "@/pages/inventory/MovementsSection"

export function AuditPage() {
  const history = orders.flatMap((order) => order.history.map((item) => ({ ...item, orderId: order.id })))
  return (
    <PageShell description="Trazabilidad de pedidos y movimientos de inventario." icon={FileClock} title="Auditoria">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cambios de pedidos">
          <div className="grid gap-2">
            {history.map((item) => <div className="rounded-md border bg-neutral-50 px-3 py-2 text-sm" key={`${item.orderId}-${item.date}`}><p className="font-medium">Pedido #{item.orderId}: {item.field}</p><p className="text-xs text-muted-foreground">{item.previousValue} {"->"} {item.newValue} por {item.user}</p></div>)}
          </div>
        </SectionCard>
        <MovementsSection />
      </div>
    </PageShell>
  )
}