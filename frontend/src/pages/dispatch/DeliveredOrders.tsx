import { Truck, Search, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCustomer, getAllCustomers, ensureCustomers, ensureProducts, ensurePackagedStock } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ShipmentRegistrationForm } from "./ShipmentRegistrationForm"
import { formatDate, getTodayLocalIsoDate } from "@/lib/format"

const ITEMS_PER_PAGE = 10

export function DeliveredOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentPageToday, setCurrentPageToday] = useState(1)
  const [currentPageOverdue, setCurrentPageOverdue] = useState(1)
  const [currentPageOther, setCurrentPageOther] = useState(1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ensureCustomers().catch(() => {})
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const todayStr = getTodayLocalIsoDate()

  const readyOrders = useMemo(
    () => orders.filter((o) => o.state === "Listo para despacho"),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return readyOrders
    const q = searchQuery.toLowerCase()
    return readyOrders.filter((order) => {
      const customer = getCustomer(order.customerId)
      return customer?.name.toLowerCase().includes(q)
    })
  }, [readyOrders, searchQuery])

  const todayOrders = useMemo(
    () => filteredOrders.filter((o) => o.date === todayStr),
    [filteredOrders, todayStr],
  )

  const overdueOrders = useMemo(
    () => filteredOrders.filter((o) => o.date < todayStr),
    [filteredOrders, todayStr],
  )

  const otherOrders = useMemo(
    () => filteredOrders.filter((o) => o.date > todayStr),
    [filteredOrders, todayStr],
  )

  const totalTodayPages = Math.ceil(todayOrders.length / ITEMS_PER_PAGE)
  const paginatedTodayOrders = todayOrders.slice(
    (currentPageToday - 1) * ITEMS_PER_PAGE,
    currentPageToday * ITEMS_PER_PAGE,
  )

  const totalOverduePages = Math.ceil(overdueOrders.length / ITEMS_PER_PAGE)
  const paginatedOverdueOrders = overdueOrders.slice(
    (currentPageOverdue - 1) * ITEMS_PER_PAGE,
    currentPageOverdue * ITEMS_PER_PAGE,
  )

  const totalOtherPages = Math.ceil(otherOrders.length / ITEMS_PER_PAGE)
  const paginatedOtherOrders = otherOrders.slice(
    (currentPageOther - 1) * ITEMS_PER_PAGE,
    currentPageOther * ITEMS_PER_PAGE,
  )

  const customerSuggestions = useMemo(() => {
    if (searchQuery.trim().length < 1) return []
    const q = searchQuery.toLowerCase()
    return getAllCustomers()
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 10)
  }, [searchQuery])

  function handleSelectCustomer(name: string) {
    setSearchQuery(name)
    setIsSearchOpen(false)
    inputRef.current?.blur()
  }

  const handleOpenSheet = (order: Order) => {
    setSelectedOrder(order)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setSelectedOrder(null)
  }

  const handleShipmentSuccess = async () => {
    const updatedOrders = await apiClients.fetchOrders()
    setOrders(updatedOrders)
    handleCloseSheet()
  }

  function renderPagination(
    currentPage: number,
    totalPages: number,
    setCurrentPage: (p: number) => void,
  ) {
    if (totalPages <= 1) return null
    return (
      <div className="mt-4 flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="flex items-center px-4 py-2 text-sm">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    )
  }

  function renderOrderCard(
    order: Order,
    variant: "default" | "overdue" = "default"
  ) {
    const customer = getCustomer(order.customerId)
    return (
      <article
        key={order.id}
        className={
          variant === "overdue"
            ? "rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm"
            : "rounded-lg border border-[#643800]/15 bg-white p-4 shadow-sm"
        }
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Pedido #{order.id}</h3>
              {variant === "overdue" && (
                <AlertTriangle className="size-4 text-red-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{customer?.name}</p>
            <p className="text-xs text-muted-foreground">
              Fecha: {formatDate(order.date)}
            </p>
          </div>
          {variant === "overdue" ? (
            <StatusBadge tone="red">Atrasado</StatusBadge>
          ) : (
            <StatusBadge tone="yellow">{order.state}</StatusBadge>
          )}
        </div>
        <div className="grid gap-2">
          {order.details.map((detail) => (
            <ProductLine key={detail.productId} {...detail} />
          ))}
        </div>
        <div className="flex gap-2 pt-4 mt-4 border-t">
          <Button
            onClick={() => handleOpenSheet(order)}
          >
            Registrar envío
          </Button>
          <Button
            variant={"outline"}
            onClick={() => {
              if (customer?.address) {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`,
                  "_blank"
                )
              }
            }}
          >
            Cómo llegar
          </Button>
        </div>
      </article>
    )
  }

  return (
    <PageShell
      title="Envíos"
      icon={Truck}
      description="Gestión de envíos listos para despacho."
    >
      {/* Barra de búsqueda */}
      <div ref={searchRef} className="relative mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            ref={inputRef}
            className="h-10 bg-white pr-9 pl-9"
            placeholder="Buscar por nombre del negocio..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
              setCurrentPageToday(1)
              setCurrentPageOverdue(1)
              setCurrentPageOther(1)
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 1) setIsSearchOpen(true)
            }}
          />

          {searchQuery && (
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery("")
                setIsSearchOpen(false)
                setCurrentPageToday(1)
                setCurrentPageOverdue(1)
                setCurrentPageOther(1)
                inputRef.current?.focus()
              }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {isSearchOpen && customerSuggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#643800]/15 bg-white shadow-lg">
            {customerSuggestions.map((customer) => (
              <li
                key={customer.id}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-[#643800]/5"
                onClick={() => handleSelectCustomer(customer.name)}
              >
                {customer.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Envíos del día */}
      <SectionCard title="Envíos del día">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">
            {todayOrders.length === 0
              ? "No hay envíos programados para hoy"
              : `${todayOrders.length} envío(s) programado(s)`}
          </p>
        </div>
        <div className="grid gap-3">
          {todayOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay envíos programados para hoy
            </p>
          ) : (
            paginatedTodayOrders.map((order) => renderOrderCard(order))
          )}
        </div>
        {renderPagination(
          currentPageToday,
          totalTodayPages,
          setCurrentPageToday
        )}
      </SectionCard>

      {/* Envíos atrasados */}
      <SectionCard title="Envíos atrasados">
        <div className="grid gap-3">
          {overdueOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay envíos atrasados
            </p>
          ) : (
            paginatedOverdueOrders.map((order) =>
              renderOrderCard(order, "overdue")
            )
          )}
        </div>
        {renderPagination(
          currentPageOverdue,
          totalOverduePages,
          setCurrentPageOverdue
        )}
      </SectionCard>

      {/* Otros envíos listos */}
      <SectionCard title="Otros envíos listos">
        <div className="grid gap-3">
          {otherOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay otros envíos pendientes
            </p>
          ) : (
            paginatedOtherOrders.map((order) => renderOrderCard(order))
          )}
        </div>
        {renderPagination(
          currentPageOther,
          totalOtherPages,
          setCurrentPageOther
        )}
      </SectionCard>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Registrar envío</SheetTitle>
            <SheetDescription>
              {selectedOrder && `Pedido #${selectedOrder.id}`}
            </SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <ShipmentRegistrationForm
              order={selectedOrder}
              onSuccess={handleShipmentSuccess}
              onClose={handleCloseSheet}
            />
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}
