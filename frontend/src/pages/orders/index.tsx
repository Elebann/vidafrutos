import { PackagePlus, Package } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { SearchBar } from "@/components/app/SearchBar"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import apiClients from "@/lib/apiClients"
import { OrderCard, OrderRow } from "@/components/order-card.tsx"
import { ensureProducts, ensureCustomers, ensurePackagedStock, getCustomer } from "@/lib/dataCache"
import type { Order } from "@/types/domain"
import { useAuth } from "@/hooks/use-auth"
import { canAccessPath } from "@/lib/permissions"
import { getValidationMessage, lettersNumbersSpaces20Schema } from "@/schemas/validationSchemas"

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const itemsPerPage = 15

  useEffect(() => {
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

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter((order) => {
      if (String(order.id).includes(q)) return true
      const customer = getCustomer(order.customerId)
      if (customer?.name.toLowerCase().includes(q)) return true
      if (order.state.toLowerCase().includes(q)) return true
      return false
    })
  }, [orders, searchQuery])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  function handleSearchChange(value: string) {
    setSearchError(getValidationMessage(lettersNumbersSpaces20Schema, value))
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <PageShell
      action={canAccessPath(user, "/pedidos/nuevo") ? {
        icon: PackagePlus,
        label: "Nuevo pedido",
        to: "/pedidos/nuevo",
      } : undefined}
      description="Registro, validacion de stock y seguimiento de pedidos."
      icon={Package}
      title="Pedidos"
    >
      <SearchBar
        placeholder="Buscar por cliente, estado o numero de pedido"
        value={searchQuery}
        onChange={handleSearchChange}
        error={searchError}
      />

      <ResponsiveList
        columns={["Pedido", "Cliente", "Estado", "Monto", "Acción"]}
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
