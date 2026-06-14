import { useParams, useNavigate } from "react-router-dom"
import { PackageOpen } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { getCustomer, getProduct, ensureCustomers, ensureProducts } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"

export function OrderDispatchDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [states, setStates] = useState<{ id: number; state: string }[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!orderId) return
    const id = Number(orderId)
    if (Number.isNaN(id)) return

    ensureProducts().catch(() => {})
    ensureCustomers().catch(() => {})
    apiClients.fetchOrderDetails(id).then((o) => setOrder(o)).catch(() => {})
    apiClients.fetchOrderStates().then(setStates).catch(() => {})
  }, [orderId])

  if (!order) return <div>Loading...</div>

  // Only show this page if order is in "En produccion" state
  if (order.state !== "En produccion") {
    return (
      <PageShell
        description="El pedido no está en estado 'En producción'"
        icon={PackageOpen}
        title={`Pedido #${order.id}`}
      >
        <SectionCard>
          <p>Este pedido no puede ser armado. Estado actual: {order.state}</p>
          <Button className="mt-4" onClick={() => navigate("/despacho")}>
            Volver a despacho
          </Button>
        </SectionCard>
      </PageShell>
    )
  }

  const customer = getCustomer(order.customerId)
  const allProductsSelected = selectedProducts.size === order.details.length && order.details.length > 0

  const handleToggleProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleConfirmDispatch = async () => {
    if (!allProductsSelected) return

    setIsSubmitting(true)
    try {
      // Get the state ID for "Listo para despacho"
      const readyForDispatchState = states.find((s) => s.state === "Listo para despacho")
      if (!readyForDispatchState) {
        toast.error("No se encontró el estado 'Listo para despacho'",{position:"top-center"})
        setIsSubmitting(false)
        return
      }

      // Update order state
      await apiClients.updateOrderState(order.id, readyForDispatchState.id)

      // Show success message
      toast.success("Pedido armado con éxito",{position: "top-center"})
      // Navigate back to dispatch page
      navigate("/despacho")
    } catch (err) {
      console.error(err)
      toast.error("Error al armar el pedido",{position: "top-center"})
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      description={`${customer?.name} - Armar pedido`}
      icon={PackageOpen}
      title={`Pedido #${order.id}`}
    >
      <div className="grid gap-4">
        <SectionCard title="Productos del pedido">
          <div className="space-y-3">
            {order.details.map((detail) => {
              const product = getProduct(detail.productId)
              const isSelected = selectedProducts.has(detail.productId)

              return (
                <div
                  key={detail.productId}
                  className="flex items-center gap-3 rounded-md border border-neutral-200 px-4 py-3"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleProduct(detail.productId)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.quantity} unidades solicitadas
                    </p>
                  </div>

                </div>
              )
            })}
          </div>
        </SectionCard>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate("/despacho")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            disabled={!allProductsSelected || isSubmitting}
            onClick={handleConfirmDispatch}
          >
            {isSubmitting ? "Procesando..." : "Terminar caja"}
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
