import { useParams } from "react-router-dom"
import { ClipboardCheck } from "lucide-react"
import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { EvidenceSection } from "@/components/app/EvidenceSection.tsx"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { getCustomer, getOrderTotal, ensureProducts, ensurePackagedStock, ensureCustomers } from "@/lib/dataCache"
import { formatCurrency } from "@/lib/format"
import { useEffect, useState, useCallback } from "react"
import apiClients from "@/lib/apiClients"
import type { Order, OrderHistory } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"
import { formatDate } from "@/lib/format"
import { useAuth } from "@/hooks/use-auth.ts"
import { OrderHistoryList } from "@/components/app/OrderHistoryList"

export function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderHistory[]>([])
  const [states, setStates] = useState<{ id: number; state: string }[]>([])
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)
  const [observation, setObservation] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.rol === 1

  const loadOrder = useCallback(() => {
    if (!orderId) return
    const id = Number(orderId)
    if (Number.isNaN(id)) return
    apiClients.fetchOrderDetails(id).then((o) => setOrder(o)).catch(() => {})
  }, [orderId])

  const loadHistory = useCallback(() => {
    if (!orderId) return
    const id = Number(orderId)
    if (Number.isNaN(id)) return
    apiClients.fetchOrderHistory(id).then(setHistory).catch(() => {})
  }, [orderId])

  useEffect(() => {
    if (!orderId) return
    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    ensureCustomers().catch(() => {})
    loadOrder()
    loadHistory()
    apiClients.fetchOrderStates().then(setStates).catch(() => {})
  }, [orderId, loadOrder, loadHistory])

  if (!order) return <div>Loading...</div>

  const customer = getCustomer(order.customerId)
  return (
    <PageShell
      description={`${customer?.name} - solicitado para ${formatDate(order.date)}`}
      icon={ClipboardCheck}
      title={`Pedido #${order.id}`}
    >
      <div className="grid gap-4">
        <SectionCard title="Productos solicitados">
          <div className="grid gap-2">
            {order.details.map((detail) => (
              <ProductLine key={detail.productId} {...detail} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
              Total estimado
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(getOrderTotal(order))}
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EvidenceSection
          evidenceType={1}
          orderId={order.id}
          title="Evidencia de entrega"
        />

        <EvidenceSection
          evidenceType={2}
          orderId={order.id}
          title="Confirmación de pago"
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormCard
            submitLabel="Actualizar estado"
            title="Cambio de estado"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!order) return
              if (!selectedStateId) return alert("Seleccione un estado")
              if (isSubmitting) return
              setIsSubmitting(true)
              try {
                await apiClients.updateOrderState(
                  order.id,
                  selectedStateId,
                  observation
                )
                const updated = await apiClients.fetchOrderDetails(order.id)
                setOrder(updated)
                loadHistory()
                alert("Estado actualizado")
              } catch (err) {
                console.error(err)
                alert("Error al actualizar estado")
              } finally {
                setIsSubmitting(false)
              }
            }}
            submitDisabled={isSubmitting}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <Select
                  value={
                    selectedStateId
                      ? String(selectedStateId)
                      : String(
                          states.find((s) => s.state === order.state)?.id ?? ""
                        )
                  }
                  onValueChange={(v) =>
                    setSelectedStateId(v ? Number(v) : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.state}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <TextField
              label="Observacion"
              placeholder="Motivo del cambio"
              value={observation}
              onChange={setObservation}
            />
          </FormCard>
          <SectionCard title="Historial de modificaciones">
            <OrderHistoryList history={history} />
          </SectionCard>
        </div>
      )}
    </PageShell>
  )
}
