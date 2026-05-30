import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Archive,
  BarChart3,
  BrainCircuit,
  Factory,
  PackagePlus,
  Receipt,
} from "lucide-react"

import { KpiCard } from "@/components/app/kpi-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge, type BadgeTone } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import {
  formatCurrency,
} from "@/data/mock-data"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import { getProduct, getMissingUnits, getOrderTotal, ensureProducts, ensurePackagedStock, ensureCustomers, getCustomer } from "@/lib/dataCache"
import type { Order } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"

function orderTone(state: string): BadgeTone {
  if (state === "Despachado" || state === "Facturado") return "green"
  if (state === "En produccion") return "yellow"
  if (state === "Listo para despacho") return "blue"
  return "neutral"
}

function OrderCard({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  const hasMissing = order.details.some((detail) => getMissingUnits(detail.productId, detail.quantity) > 0)

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Pedido #{order.id}</p>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </div>
        <StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge>
      </div>
      <div className="mb-3 grid gap-2">{order.details.slice(0, 2).map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{formatCurrency(getOrderTotal(order))}</span>
        {hasMissing && <StatusBadge tone="red">Con faltantes</StatusBadge>}
        <Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  return (
    <>
      <td className="px-4 py-3 font-medium">#{order.id}</td>
      <td className="px-4 py-3">{customer?.name}</td>
      <td className="px-4 py-3"><StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge></td>
      <td className="px-4 py-3 font-medium">{formatCurrency(getOrderTotal(order))}</td>
      <td className="px-4 py-3"><Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">Ver</Button></td>
    </>
  )
}

export function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [critical, setCritical] = useState<any[]>([])

  useEffect(() => {
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    ensureCustomers().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
    apiClients.fetchInvoices().then(setInvoices).catch(() => {})
    // compute critical stocks from packaged stock
    apiClients.fetchPackagedStock().then((ps) => setCritical(ps.filter((s) => s.availableStock <= s.minimumStock))).catch(() => {})
  }, [])

  const pendingOrders = orders.filter((order) => order.state !== "Despachado" && order.state !== "Facturado")
  const dailySales = invoices.reduce((total, invoice) => total + (invoice.total ?? 0), 0)

  return (
    <PageShell
      description="Resumen operacional para ventas, inventario y produccion diaria."
      icon={BarChart3}
      title="Inicio"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          detail="Facturas emitidas hoy y ayer operacional."
          icon={Receipt}
          label="Ventas recientes"
          value={formatCurrency(dailySales)}
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
          label="Stock critico"
          tone="danger"
          value={`${critical.length}`}
        />
        <KpiCard
          detail="Promedio estimado del modulo predictivo."
          icon={BrainCircuit}
          label="Confianza IA"
          tone="success"
          value="82%"
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
                label: "Actualizar stock",
                to: "/inventario/actualizar",
              },
              {
                icon: Factory,
                label: "Registrar produccion",
                to: "/produccion/registrar",
              },
              {
                icon: Receipt,
                label: "Generar factura",
                to: "/facturas/generar",
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

        <SectionCard title="Alertas de stock">
          <div className="grid gap-2">
            {critical.map((stock) => {
              const product = getProduct(stock.productId)
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-3 py-2"
                  key={stock.productId}
                >
                  <div>
                    <p className="text-sm font-medium">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Minimo {stock.minimumStock} unidades
                    </p>
                  </div>
                  <StatusBadge tone="red">
                    {stock.availableStock} disp.
                  </StatusBadge>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Pedidos para hoy">
        <ResponsiveList
          columns={["Pedido", "Cliente", "Estado", "Total", "Accion"]}
          items={orders}
          keyExtractor={(order) => order.id}
          renderCard={(order) => <OrderCard order={order} />}
          renderRow={(order) => <OrderRow order={order} />}
        />
      </SectionCard>
    </PageShell>
  )
}
