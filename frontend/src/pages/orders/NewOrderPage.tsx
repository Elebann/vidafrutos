import { PackagePlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import { ensureProducts, ensureCustomers, ensurePackagedStock, getPackagedStock } from "@/lib/dataCache"
import type { Product, Customer } from "@/types/domain"
import { ProductLine } from "@/components/app/ProductLine"

export function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    ensurePackagedStock().catch(() => {})
    apiClients.fetchCustomers().then(setCustomers).catch(() => {})
    apiClients.fetchProducts().then(setProducts).catch(() => {})
  }, [])

  return (
    <PageShell description="Formulario pensado para registrar pedidos en terreno desde telefono." icon={PackagePlus} title="Nuevo pedido">
      <FormCard submitLabel="Registrar pedido" title="Datos del pedido">
        <FieldGroup>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select defaultValue={customers[0]?.id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <TextField label="Fecha solicitada" type="date" value="2026-05-15" />
        {products.filter((product) => product.active).slice(0, 4).map((product) => {
          const stock = getPackagedStock(product.id)
          return (
            <FieldGroup key={product.id}>
              <Field>
                <FieldLabel>{product.name}</FieldLabel>
                <Input placeholder={`Disponible: ${stock?.availableStock ?? 0}`} type="number" />
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
