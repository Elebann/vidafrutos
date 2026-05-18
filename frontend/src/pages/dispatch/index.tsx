import { Truck } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { getCustomer, orders } from "@/data/mock-data"
import { ProductLine } from "@/components/app/ProductLine"

function orderTone(state: string): "green" | "yellow" | "blue" | "neutral" {
  if (state === "Despachado" || state === "Facturado") return "green"
  if (state === "En produccion") return "yellow"
  if (state === "Listo para despacho") return "blue"
  return "neutral"
}

export function DispatchPage() {
  const dispatchOrders = orders.filter((order) => order.state === "Listo para despacho" || order.state === "En produccion" || order.state === "Validado")
  return (
    <PageShell description="Armado de cajas y confirmacion de salida." icon={Truck} title="Despacho">
      <div className="grid gap-3">
        {dispatchOrders.map((order) => (
          <SectionCard key={order.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Pedido #{order.id}</h2>
                <p className="text-sm text-muted-foreground">{getCustomer(order.customerId)?.name}</p>
              </div>
              <StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge>
            </div>
            <div className="grid gap-2">{order.details.map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
            <Button className="mt-4 w-full sm:w-auto" variant="secondary">Confirmar despacho</Button>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  )
}