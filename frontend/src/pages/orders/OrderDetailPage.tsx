import { useParams } from "react-router-dom"
import { ClipboardCheck } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { getCustomer, getOrderTotal, ensureProducts, ensurePackagedStock, ensureCustomers } from "@/lib/dataCache"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"

export function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    const id = Number(orderId)
    if (Number.isNaN(id)) return

    ensureProducts().catch(() => {})
    ensurePackagedStock().catch(() => {})
    ensureCustomers().catch(() => {})
    apiClients.fetchOrderDetails(id).then((o) => setOrder(o)).catch(() => {})
  }, [orderId])

  if (!order) return <div>Loading...</div>

  const customer = getCustomer(order.customerId)

  return (
    <PageShell description={`${customer?.name} - solicitado para ${order.requestedDate}`} icon={ClipboardCheck} title={`Pedido #${order.id}`}>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Productos solicitados">
          <div className="grid gap-2">{order.details.map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <strong className="text-lg">{getOrderTotal(order)}</strong>
          </div>
        </SectionCard>
        <FormCard submitLabel="Actualizar estado" title="Cambio de estado">
          <FieldGroup>
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <Select defaultValue={order.state}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["Registrado", "Validado", "En produccion", "Listo para despacho", "Despachado", "Facturado"].map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <TextField label="Observacion" placeholder="Motivo del cambio" />
        </FormCard>
      </div>
      <SectionCard title="Historial de modificaciones">
        <div className="grid gap-2">
          {order.history.map((item) => (
            <div className="rounded-md border bg-neutral-50 px-3 py-2 text-sm" key={`${item.date}-${item.field}`}>
              <p className="font-medium">{item.field}: {item.previousValue} {"->"} {item.newValue}</p>
              <p className="text-xs text-muted-foreground">{item.date} por {item.user}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}
