import { useParams } from "react-router-dom"
import { Users } from "lucide-react"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { useEffect, useState } from "react"
import { getCustomer, ensureCustomers } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { OrderCard } from "@/pages/orders/components"

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])

  useEffect(() => {
    const id = Number(customerId)
    ensureCustomers().catch(() => {})
    apiClients.fetchOrders().then((all) => setCustomerOrders(all.filter((o) => o.customerId === id))).catch(() => {})
    ensureCustomers().then(() => setCustomer(getCustomer(id))).catch(() => {})
  }, [customerId])

  if (!customer) return <div>Loading...</div>

  return (
    <PageShell description={customer.address + " - " + customer.rut} icon={Users} title={customer.name}>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Ficha comercial">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">RUT</dt><dd className="font-medium">{customer.rut}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Pedidos recientes">
          <div className="grid gap-2">{customerOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
        </SectionCard>
      </div>
    </PageShell>
  )
}
