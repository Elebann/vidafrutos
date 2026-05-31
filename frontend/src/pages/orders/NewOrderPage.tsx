import { PackagePlus } from "lucide-react"

import { FormCard } from "@/components/app/form-card"
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
import { Button } from "@/components/ui/button"
import apiClients from "@/lib/apiClients"
import { ensurePackagedStock, getPackagedStock } from "@/lib/dataCache"
import type { Product, Customer } from "@/types/domain"

type OrderProduct = { productId: number | null; quantity: number }

export function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([])
  // single static selector state
  const [currentProductId, setCurrentProductId] = useState<number | null>(null)
  const [currentQuantity, setCurrentQuantity] = useState<number>(1)
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    ensurePackagedStock().catch(() => {})
    apiClients.fetchCustomers().then(setCustomers).catch(() => {})
    apiClients.fetchProducts().then(setProducts).catch(() => {})
  }, [])

  async function registerOrder() {
    if (isSubmitting) return

    // Build payload
    const payload = {
      customerId: selectedCustomerId,
      date,
      items: orderProducts
        .filter((p) => p.productId && p.quantity > 0)
        .map((p) => ({ productId: p.productId, quantity: p.quantity })),
    }

    // Basic validation (do before setting submitting state)
    if (!payload.customerId) return alert("Seleccione un cliente antes de registrar el pedido")
    if (payload.items.length === 0) return alert("Agregue al menos un producto con cantidad mayor a 0")

    setIsSubmitting(true)

    try {
      const res = await apiClients.createOrder(payload)
      console.log('createOrder result', res)
      alert("Pedido registrado (id: " + (res?.id ?? 'n/a') + ")")
      // reset
      setOrderProducts([])
      setSelectedCustomerId(null)
    } catch (e) {
      console.error(e)
      alert("Error al registrar pedido: " + (e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell description="Formulario pensado para registrar pedidos en terreno desde telefono." icon={PackagePlus} title="Nuevo pedido">
      <FormCard submitLabel="Registrar pedido" title="Datos del pedido" onSubmit={(e) => { e.preventDefault(); registerOrder() }} submitDisabled={isSubmitting}>
        <div className="w-full">

          <FieldGroup>
            <Field>
              <FieldLabel>Cliente</FieldLabel>
                <Select
                  value={selectedCustomerId ? String(selectedCustomerId) : ""}
                  onValueChange={(value) => setSelectedCustomerId(value ? Number(value) : null)}
                >
                  <SelectTrigger className="w-full whitespace-normal">
                  
                  <SelectValue placeholder="Seleccione cliente">
                    {selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup className="sm:col-span-2">
            <Field>
              <FieldLabel>Fecha solicitada</FieldLabel>
            <Input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}/>
            </Field>
          </FieldGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FieldGroup>
            <Field>
              <FieldLabel>Producto a agregar</FieldLabel>
               <Select value={currentProductId ? String(currentProductId) : ""} onValueChange={(v) => setCurrentProductId(v ? Number(v) : null)}>
                 <SelectTrigger className="w-full whitespace-normal">
                  <SelectValue placeholder="Seleccione producto">
                    {currentProductId ? products.find((p) => p.id === currentProductId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.filter((p) => p.active).map((product) => {
                      const stock = getPackagedStock(product.id)
                      return (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name} {`(Disp: ${stock?.availableStock ?? 0})`}
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
               <FieldLabel>Cantidad a agregar</FieldLabel>
               <Input type="number" value={String(currentQuantity)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentQuantity(Number(e.target.value || 0))} />
            </Field>
          </FieldGroup>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="VFBrown"
            onClick={() => {
              if (!currentProductId) return alert('Seleccione un producto')
              if (currentQuantity <= 0) return alert('Ingrese una cantidad mayor a 0')
              setOrderProducts((prev) => {
                const existing = prev.find((p) => p.productId === currentProductId)
                if (existing) {
                  // merge quantities
                  return prev.map((p) => (p.productId === currentProductId ? { ...p, quantity: p.quantity + currentQuantity } : p))
                }
                return [...prev, { productId: currentProductId, quantity: currentQuantity }]
              })
            }}
          >
            Agregar producto
          </Button>
          <Button type="button" variant="outline" onClick={() => { setCurrentProductId(null); setCurrentQuantity(1) }}>
            Limpiar selección
          </Button>
        </div>
        </div>
      </FormCard>

      <SectionCard title="Validacion visual de stock">
        <div className="grid gap-2">
          <div>
            <strong>Cliente:</strong> {selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : "-"}
          </div>
          <div>
            <strong>Fecha:</strong> {date}
          </div>

          <div className="space-y-2">
            {orderProducts.filter((p) => p.productId).length === 0 && <div>No hay productos en el pedido</div>}
            {orderProducts.map((op, i) => {
              if (!op.productId) return null
              const prod = products.find((p) => p.id === op.productId)
              const stock = getPackagedStock(op.productId)
              return (
                <div key={i} className="p-2 border rounded">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <strong>{prod?.name ?? `Producto ${op.productId}`}</strong>
                      <div>Pedido: {op.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div>Disponible: {stock?.availableStock ?? 0}</div>
                      <div className={op.quantity > (stock?.availableStock ?? 0) ? "text-red-600" : "text-green-600"}>
                        {op.quantity > (stock?.availableStock ?? 0) ? "Insuficiente" : "OK"}
                      </div>
                    </div>
                    <div>
                      <Button type="button" variant="ghost" onClick={() => setOrderProducts((s) => s.filter((_, idx2) => idx2 !== i))}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {orderProducts.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (!confirm('Eliminar todo el pedido? Esto limpiará los productos agregados.')) return
                    setOrderProducts([])
                  }}
                >
                  Eliminar pedido (limpiar)
                </Button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </PageShell>
  )
}
