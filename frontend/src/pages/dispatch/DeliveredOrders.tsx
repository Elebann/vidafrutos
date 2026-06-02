import { Truck } from "lucide-react"
import { useEffect, useState } from "react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Button } from "@/components/ui/button"
import { getCustomer, ensureCustomers, ensureProducts, ensurePackagedStock } from "@/lib/dataCache"
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

export function DeliveredOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    ensureCustomers().catch(() => {})
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    apiClients.fetchOrders().then(setOrders).catch(() => {})
  }, [])

  const readyOrders = orders.filter((order) => order.state === "Listo para despacho")

  const handleOpenSheet = (order: Order) => {
    setSelectedOrder(order)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setSelectedOrder(null)
  }

  const handleShipmentSuccess = async () => {
    // Refresh orders list
    const updatedOrders = await apiClients.fetchOrders()
    setOrders(updatedOrders)
    handleCloseSheet()
  }

  return (
    <PageShell
      title="Pedidos entregados"
      icon={Truck}
      description="Resumen de pedidos entregados y su estado de pago."
    >
      <div className="grid gap-3">
        {readyOrders.map((order) => (
          <SectionCard key={order.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Pedido #{order.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {getCustomer(order.customerId)?.name}
                </p>
              </div>
              <span className="text-sm font-medium text-yellow-600">
                {order.state}
              </span>
            </div>
            <div className="grid gap-2">
              {order.details.map((detail) => (
                <ProductLine key={detail.productId} {...detail} />
              ))}
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => handleOpenSheet(order)}
            >
              Registrar envío
            </Button>
          </SectionCard>
        ))}
      </div>

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
