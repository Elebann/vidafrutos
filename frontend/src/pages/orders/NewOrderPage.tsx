import { PackagePlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { customers, getPackagedStock, products } from "@/data/mock-data"
import { ProductLine } from "@/components/app/ProductLine"

export function NewOrderPage() {
  return (
    <PageShell description="Formulario pensado para registrar pedidos en terreno desde telefono." icon={PackagePlus} title="Nuevo pedido">
      <FormCard submitLabel="Registrar pedido" title="Datos del pedido">
        <FieldGroup>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <select className="h-10 rounded-lg border bg-white px-3 text-sm">
              {customers.map((customer) => <option key={customer.id}>{customer.name}</option>)}
            </select>
          </Field>
        </FieldGroup>
        <TextField label="Fecha solicitada" type="date" value="2026-05-15" />
        {products.filter((product) => product.active).slice(0, 4).map((product) => {
          const stock = getPackagedStock(product.id)
          return (
            <FieldGroup key={product.id}>
              <Field>
                <FieldLabel>{product.name}</FieldLabel>
                <input className="h-10 rounded-lg border bg-white px-3 text-sm" placeholder={`Disponible: ${stock?.availableStock ?? 0}`} type="number" />
              </Field>
            </FieldGroup>
          )
        })}
      </FormCard>
      <SectionCard title="Validacion visual de stock">
        <div className="grid gap-2">
          <ProductLine productId={2} quantity={96} />
          <ProductLine productId={4} quantity={42} />
        </div>
      </SectionCard>
    </PageShell>
  )
}