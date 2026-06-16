import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Archive,
  Home,
  PackagePlus,
  Receipt,
} from "lucide-react"

import { KpiCard } from "@/components/app/kpi-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, filterByMonth } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import { getProduct, ensureProducts, ensurePackagedStock, ensureCustomers } from "@/lib/dataCache"
import type { Invoice, Order, PackagedStock } from "@/types/domain"
import { OrderCard, OrderRow } from "@/components/order-card"

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [critical, setCritical] = useState<PackagedStock[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    ensureCustomers().catch(() => {})
    apiClients.fetchOrders()
      .then(data => {
        const sorted = [...data].sort((a, b) => b.id - a.id)
        setOrders(sorted)
      })
      .catch(() => {})
    apiClients.fetchInvoices().then(setInvoices).catch(() => {})
    // compute critical stocks from packaged stock
    apiClients.fetchPackagedStock().then((ps) => setCritical(ps.filter((s) => s.availableStock <= s.minimumStock))).catch(() => {})
  }, [])

  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const pendingOrders = orders.filter((order) => order.state !== "Enviado" && order.state !== "Pago confirmado")
  const monthlySales = filterByMonth(invoices, "date").reduce((total, invoice) => total + (invoice.total ?? 0), 0)

  return (
    <PageShell
      description="Resumen operacional para ventas, inventario y producción diaria."
      icon={Home}
      title="Inicio administrador"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          detail="Total facturado en el mes actual."
          icon={Receipt}
          label="Ventas del mes"
          value={formatCurrency(monthlySales)}
        />
        <KpiCard
          detail="Pedidos que aun requieren validacion, produccion o despacho."
          icon={PackagePlus}
          label="Pedidos activos"
          tone="warning"
          value={`${pendingOrders.length}`}
        />
        <KpiCard
          detail="Productos bajo o igual al minimo configurado."
          icon={AlertTriangle}
          label="Stock crítico"
          tone="danger"
          value={`${critical.length}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Acciones rapidas">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: PackagePlus,
                label: "Nuevo pedido",
                to: "/pedidos/nuevo",
              },
              {
                icon: Archive,
                label: "Ver inventario",
                to: "/inventario",
              },
              {
                icon: Archive,
                label: "Registrar produccion",
                to: "/inventario/actualizar",
              },
              {
                icon: Receipt,
                label: "Generar factura",
                to: "/pagos",
              },
            ].map((item) => (
              <Button
                className="h-11 justify-start"
                key={item.label}
                render={<Link to={item.to} />}
                variant="outline"
              >
                <item.icon className="size-5" />
                {item.label}
              </Button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Productos con stock bajo">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {critical.map((stock) => {
              const product = getProduct(stock.productId)
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-sm border px-3 py-2"
                  key={stock.productId}
                >
                  <div>
                    <p className="text-sm font-medium">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mín. establecido: {stock.minimumStock}
                    </p>
                  </div>

                  <StatusBadge tone="red">{stock.availableStock}</StatusBadge>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Pedidos registrados"
      >
        <ResponsiveList
          columns={["Pedido", "Cliente", "Estado", "Total", "Accion"]}
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
      </SectionCard>
    </PageShell>
  )
}
