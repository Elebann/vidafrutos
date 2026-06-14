import { PackageOpen, ArrowUp, ArrowDown, FileDown, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { getCustomer, getProduct, ensureCustomers, ensureProducts, ensurePackagedStock } from "@/lib/dataCache"
import { useEffect, useMemo, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import { useNavigate } from "react-router-dom"
import { downloadDispatchPdf } from "@/lib/pdf/dispatchPdf"
import toast from "react-hot-toast"

const ITEMS_PER_PAGE = 7

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DispatchPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    ensureCustomers().catch(() => {})
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
  }, [])

  const todayStr = getTodayString()

  const dispatchOrders = useMemo(
    () => orders.filter((o) => o.state === "En produccion"),
    [orders],
  )

  const todayOrders = useMemo(
    () => dispatchOrders.filter((o) => o.date.slice(0, 10) === todayStr),
    [dispatchOrders, todayStr],
  )

  const otherOrders = useMemo(() => {
    const list = dispatchOrders.filter((o) => o.date.slice(0, 10) !== todayStr)
    return list.sort((a, b) => {
      const cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [dispatchOrders, sortDir])

  const overdueOrders = useMemo(
    () => dispatchOrders.filter((o) => o.date.slice(0, 10) < todayStr),
    [dispatchOrders, todayStr],
  )

  const totalOtherPages = Math.ceil(otherOrders.length / ITEMS_PER_PAGE)
  const paginatedOtherOrders = otherOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  function handlePrintPdf() {
    if (todayOrders.length === 0) {
      toast.error("No hay despachos del día para imprimir")
      return
    }

    const customersById = new Map<number, string>()
    const productsById = new Map<number, string>()

    todayOrders.forEach((order) => {
      const customer = getCustomer(order.customerId)
      if (customer) customersById.set(order.customerId, customer.name)
      order.details.forEach((d) => {
        const product = getProduct(d.productId)
        if (product) productsById.set(d.productId, product.name)
      })
    })

    downloadDispatchPdf(todayOrders, { customersById, productsById })
    toast.success("PDF descargado")
  }

  function handleToggleSort() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    setCurrentPage(1)
  }

  return (
    <PageShell
      description="Armado de cajas y confirmacion de salida."
      icon={PackageOpen}
      title="Armado de cajas"
    >
      {/* Listado de despachos del día */}
      <SectionCard title="Listado de despachos del día">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {todayOrders.length === 0
              ? "No hay despachos agendados para hoy"
              : `${todayOrders.length} pedido(s) programado(s)`}
          </p>
          <Button
            variant="VFBrown"
            size="sm"
            onClick={handlePrintPdf}
            disabled={todayOrders.length === 0}
          >
            <FileDown className="size-3.5" />
            Imprimir PDF
          </Button>
        </div>
        <div className="grid gap-3">
          {todayOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay despachos agendados para hoy
            </p>
          ) : (
            todayOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-[#643800]/15 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Pedido #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getCustomer(order.customerId)?.name}
                    </p>
                  </div>
                  <StatusBadge tone="yellow">{order.state}</StatusBadge>
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
              </article>
            ))
          )}
        </div>
      </SectionCard>

      {/* Pedidos atrasados */}
      <SectionCard title="Pedidos atrasados">
        <div className="grid gap-3">
          {overdueOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay pedidos atrasados
            </p>
          ) : (
            overdueOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Pedido #{order.id}</h3>
                      <AlertTriangle className="size-4 text-red-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCustomer(order.customerId)?.name}
                    </p>
                    <p className="text-xs text-red-600">
                      Fecha: {new Date(order.date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <StatusBadge tone="red">Atrasado</StatusBadge>
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
              </article>
            ))
          )}
        </div>
      </SectionCard>

      {/* Otros despachos */}
      
      <SectionCard title="Otros despachos">
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleToggleSort}
          >
            {sortDir === "desc" ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />}
            {sortDir === "desc" ? "Mayor a menor" : "Menor a mayor"}
          </Button>
        </div>
        <div className="grid gap-3">
          {otherOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay otros despachos pendientes
            </p>
          ) : (
            paginatedOtherOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-[#643800]/15 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Pedido #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getCustomer(order.customerId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fecha: {new Date(order.date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <StatusBadge tone="yellow">{order.state}</StatusBadge>
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
              </article>
            ))
          )}
        </div>

        {totalOtherPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="flex items-center px-4 py-2 text-sm">
              Página {currentPage} de {totalOtherPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalOtherPages))}
              disabled={currentPage === totalOtherPages}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
