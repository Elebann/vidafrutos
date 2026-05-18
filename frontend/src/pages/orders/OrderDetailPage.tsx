import { useParams } from "react-router-dom"
import { ClipboardCheck } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { getCustomer, getOrderTotal, orders } from "@/data/mock-data"
import { ProductLine } from "@/components/app/ProductLine"

export function OrderDetailPage() {
  const { orderId } = useParams()
  const order = orders.find((item) => item.id === Number(orderId)) ?? orders[0]
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
              <select className="h-10 rounded-lg border bg-white px-3 text-sm" defaultValue={order.state}>
                {["Registrado", "Validado", "En produccion", "Listo para despacho", "Despachado", "Facturado"].map((state) => <option key={state}>{state}</option>)}
              </select>
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