import { PackagePlus } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { SearchBar } from "@/components/app/SearchBar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import { OrderCard, OrderRow } from "@/components/order-card.tsx"
import { ensureProducts, ensureCustomers, ensurePackagedStock } from "@/lib/dataCache"
import type { Order } from "@/types/domain"

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

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
        const sorted = [...fetched].sort((a, b) => b.id - a.id)
        setOrders(sorted)
      } catch {
        // ignore
      }
    })()
  }, [])

  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <PageShell
      action={{
        icon: PackagePlus,
        label: "Nuevo pedido",
        to: "/pedidos/nuevo",
      }}
      description="Registro, validacion de stock y seguimiento de pedidos."
      icon={PackagePlus}
      title="Pedidos"
    >
      <SearchBar placeholder="Buscar por cliente, estado o numero de pedido" />

      <ResponsiveList
        columns={["Pedido", "Cliente", "Estado", "Acción"]}
        items={paginatedOrders}
        keyExtractor={(order) => order.id}
        renderCard={(order) => <OrderCard order={order} />}
        renderRow={(order) => <OrderRow order={order} />}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 py-2 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </PageShell>
  )
}
