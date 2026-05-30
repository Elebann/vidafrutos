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
    // prefetch related caches
    ensureProducts().catch(() => {})
    ensureCustomers().catch(() => {})
    ensurePackagedStock().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
  }, [])

  return (
    <PageShell action={{ icon: PackagePlus, label: "Nuevo pedido", to: "/pedidos/nuevo" }} description="Registro, validacion de stock y seguimiento de pedidos." icon={PackagePlus} title="Pedidos">
      <SearchBar placeholder="Buscar por cliente, estado o numero de pedido" />
      <ResponsiveList columns={["Pedido", "Cliente", "Estado", "Total", "Accion"]} items={orders} keyExtractor={(order) => order.id} renderCard={(order) => <OrderCard order={order} />} renderRow={(order) => <OrderRow order={order} />} />
    </PageShell>
  )
}
