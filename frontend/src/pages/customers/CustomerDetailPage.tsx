import { useParams } from "react-router-dom"
import { Users } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { customers, formatCurrency, orders } from "@/data/mock-data"
import { OrderCard } from "@/pages/orders/components"

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const customer = customers.find((item) => item.id === Number(customerId)) ?? customers[0]
  const customerOrders = orders.filter((order) => order.customerId === customer.id)
  return (
    <PageShell description={customer.address} icon={Users} title={customer.name}>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Ficha comercial">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">RUT</dt><dd className="font-medium">{customer.rut}</dd></div>
            <div><dt className="text-muted-foreground">Ultimo pedido</dt><dd className="font-medium">{customer.lastOrderDate}</dd></div>
            <div><dt className="text-muted-foreground">Saldo</dt><dd className="font-medium">{customer.balance > 0 ? formatCurrency(customer.balance) : "Al dia"}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Pedidos recientes">
          <div className="grid gap-2">{customerOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
        </SectionCard>
      </div>
    </PageShell>
  )
}