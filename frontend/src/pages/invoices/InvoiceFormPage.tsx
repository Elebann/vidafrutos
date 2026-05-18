import { Receipt } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { getCustomer, orders } from "@/data/mock-data"

export function InvoiceFormPage() {
  return (
    <PageShell description="Emision simulada desde un pedido validado." icon={Receipt} title="Generar factura">
      <FormCard submitLabel="Generar factura" title="Datos tributarios">
        <FieldGroup><Field><FieldLabel>Pedido</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{orders.map((order) => <option key={order.id}>Pedido #{order.id} - {getCustomer(order.customerId)?.name}</option>)}</select></Field></FieldGroup>
        <FieldGroup><Field><FieldLabel>Metodo de pago</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm"><option>Transferencia</option><option>Efectivo</option><option>Debito</option><option>Credito</option></select></Field></FieldGroup>
        <TextField label="Total" type="number" value="86200" />
      </FormCard>
    </PageShell>
  )
}