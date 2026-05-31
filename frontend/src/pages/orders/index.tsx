import { PackagePlus } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { SearchBar } from "@/components/app/SearchBar"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import { OrderCard, OrderRow } from "./components"
import { ensureProducts, ensureCustomers, ensurePackagedStock } from "@/lib/dataCache"
import type { Order } from "@/types/domain"

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    // Prefetch related caches and ensure they are loaded before fetching orders so
    // order totals (which depend on product prices) can be calculated synchronously
    // during render. We intentionally await caches here and then fetch orders.
    ;(async () => {
      try {
        await ensureProducts()
      } catch {
        // ignore
      }
      try {
        await ensureCustomers()
      } catch {
        // ignore
      }
      try {
        await ensurePackagedStock()
      } catch {
        // ignore
      }

      try {
        const fetched = await apiClients.fetchOrders()
        setOrders(fetched)
      } catch {
        // ignore
      }
    })()
  }, [])

  return (
    <PageShell action={{ icon: PackagePlus, label: "Nuevo pedido", to: "/pedidos/nuevo" }} description="Registro, validacion de stock y seguimiento de pedidos." icon={PackagePlus} title="Pedidos">
      <SearchBar placeholder="Buscar por cliente, estado o numero de pedido" />
      <ResponsiveList
        columns={["Pedido", "Cliente", "Estado", "Acción"]}
        items={orders}
        keyExtractor={(order) => order.id}
        renderCard={(order) => <OrderCard order={order} />}
        renderRow={(order) => <OrderRow order={order} />} />
    </PageShell>
  )
}
