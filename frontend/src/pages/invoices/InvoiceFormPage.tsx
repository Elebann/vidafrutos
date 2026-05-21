import { Receipt } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { getCustomer, orders } from "@/data/mock-data"

export function InvoiceFormPage() {
  return (
    <PageShell description="Emision simulada desde un pedido validado." icon={Receipt} title="Generar factura">
      <FormCard submitLabel="Generar factura" title="Datos tributarios">
        <FieldGroup>
          <Field>
            <FieldLabel>Pedido</FieldLabel>
            <Select defaultValue={String(orders[0]?.id)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={String(order.id)}>
                      {`Pedido #${order.id} - ${getCustomer(order.customerId)?.name}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <FieldGroup>
          <Field>
            <FieldLabel>Metodo de pago</FieldLabel>
            <Select defaultValue="Transferencia">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {['Transferencia','Efectivo','Debito','Credito'].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <TextField label="Total" type="number" value="86200" />
      </FormCard>
    </PageShell>
  )
}
