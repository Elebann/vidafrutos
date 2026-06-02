import { PackageOpen } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { getCustomer, ensureCustomers, ensureProducts, ensurePackagedStock } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import { useNavigate } from "react-router-dom"

export function DispatchPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    ensureCustomers().catch(() => {})
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
  }, [])

  const dispatchOrders = orders.filter((order) => order.state === "En produccion")

  return (
    <PageShell
      description="Armado de cajas y confirmacion de salida."
      icon={PackageOpen}
      title="Armado de cajas"
    >
      <div className="grid gap-3">
        {dispatchOrders.map((order) => (
          <SectionCard key={order.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Pedido #{order.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {getCustomer(order.customerId)?.name}
                </p>
              </div>
              <StatusBadge tone="yellow">
                {order.state}
              </StatusBadge>
            </div>
            <div className="grid gap-2">
              {order.details.map((detail) => (
                <ProductLine key={detail.productId} {...detail} />
              ))}
            </div>
            <Button 
              className="mt-4 w-full sm:w-auto" 
              onClick={() => navigate(`/despacho/${order.id}`)}
            >
              Armar pedido
            </Button>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  )
}
