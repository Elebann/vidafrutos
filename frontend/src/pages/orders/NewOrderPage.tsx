import { PackageOpen, PackagePlus, X } from "lucide-react"

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
import { ensurePackagedStock, ensureProducts, getPackagedStock } from "@/lib/dataCache"
import type { Product, Customer } from "@/types/domain"
import { cn } from "@/lib/utils"

type OrderProduct = { productId: number | null; quantity: number }

function formatSpanishDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function OrderItemRow({
  item,
  index,
  product,
  availableStock,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: OrderProduct
  index: number
  product: Product | undefined
  availableStock: number
  onIncrement: (index: number) => void
  onDecrement: (index: number) => void
  onRemove: (index: number) => void
}) {
  const isInsufficient = item.quantity > availableStock
  const productName = product?.name ?? `Producto ${item.productId ?? "?"}`
  const gramsLabel =
    product?.grams && product.grams > 0
      ? `${product.grams} g por unidad`
      : null

  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#643800]/15 bg-white p-4 shadow-[0_1px_0_rgba(128,79,23,0.04),0_2px_6px_-2px_rgba(128,79,23,0.06)] transition-all duration-300 ease-out hover:border-[#804f17]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-[family-name:var(--font-heading)] text-[1.2rem] leading-[1.1] tracking-tight text-neutral-900">
            {productName}
          </h4>
          {gramsLabel && (
            <p className="mt-0.5 text-xs text-neutral-500">{gramsLabel}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          aria-label={`Eliminar ${productName} del pedido`}
          className="size-7 shrink-0 p-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onDecrement(index)}
            disabled={item.quantity <= 1}
            aria-label={`Disminuir cantidad de ${productName}`}
            className="size-7 p-0"
          >
            −
          </Button>
          <div className="flex h-7 min-w-10 items-center justify-center font-[family-name:var(--font-heading)] text-lg leading-none text-neutral-900 tabular-nums">
            {item.quantity}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onIncrement(index)}
            aria-label={`Aumentar cantidad de ${productName}`}
            className="size-7 p-0"
          >
            +
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Stock
            </span>
            <p className="text-sm font-medium text-neutral-700 tabular-nums">
              {availableStock}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
              isInsufficient
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {isInsufficient ? "Insuficiente" : "Suficiente"}
          </span>
        </div>
      </div>
    </article>
  )
}

function EmptyOrderState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#643800]/25 bg-[#fdf3e8]/40 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-[#804f17] ring-1 ring-[#804f17]/15">
        <PackageOpen className="size-5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-neutral-700">
          Aún no hay productos en el pedido
        </p>
        <p className="text-xs text-neutral-500">
          Selecciona un producto y agrégalo desde el formulario para verlo aquí
        </p>
      </div>
    </div>
  )
}

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
    ensureProducts().catch(() => {})
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

    // Check for insufficient stock — ask confirmation if any product exceeds availability
    const insufficientItems = payload.items
      .map((item) => {
        if (!item.productId) return null
        const available = getPackagedStock(item.productId)?.availableStock ?? 0
        if (item.quantity > available) {
          const product = products.find((p) => p.id === item.productId)
          return product?.name ?? `Producto ${item.productId}`
        }
        return null
      })
      .filter((name): name is string => name !== null)

    if (insufficientItems.length > 0) {
      const message =
        insufficientItems.length === 1
          ? `El producto "${insufficientItems[0]}" no tiene stock suficiente. ¿Deseas registrar el pedido de todas formas?`
          : `Hay ${insufficientItems.length} productos con stock insuficiente. ¿Deseas registrar el pedido de todas formas?`
      if (!confirm(message)) return
    }

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

  function handleCancel() {
    setOrderProducts([])
  }

  function handleIncrement(index: number) {
    setOrderProducts((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    )
  }

  function handleDecrement(index: number) {
    setOrderProducts((prev) =>
      prev.map((item, idx) =>
        idx === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    )
  }

  return (
    <PageShell
      description="Se calculará automáticamente qué necesita producir"
      icon={PackagePlus}
      title="Nuevo pedido"
    >
      <FormCard
        submitLabel="Registrar pedido"
        title="Datos del pedido"
        onSubmit={(e) => {
          e.preventDefault()
          registerOrder()
        }}
        onCancel={handleCancel}
        submitDisabled={isSubmitting}
      >

          <FieldGroup>
            <Field>
              <FieldLabel>Cliente</FieldLabel>
              <Select
                value={selectedCustomerId ? String(selectedCustomerId) : ""}
                onValueChange={(value) =>
                  setSelectedCustomerId(value ? Number(value) : null)
                }
              >
                <SelectTrigger className="w-full whitespace-normal">
                  <SelectValue placeholder="Seleccione cliente">
                    {selectedCustomerId
                      ? customers.find((c) => c.id === selectedCustomerId)?.name
                      : undefined}
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
              <Input
                type="date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDate(e.target.value)
                }
              />
            </Field>
          </FieldGroup>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel>Producto a agregar</FieldLabel>
                <Select
                  value={currentProductId ? String(currentProductId) : ""}
                  onValueChange={(v) =>
                    setCurrentProductId(v ? Number(v) : null)
                  }
                >
                  <SelectTrigger className="w-full whitespace-normal">
                    <SelectValue placeholder="Seleccione producto">
                      {currentProductId
                        ? products.find((p) => p.id === currentProductId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {products
                        .filter((p) => p.active)
                        .map((product) => {
                          const stock = getPackagedStock(product.id)
                          const availableStock = stock?.availableStock ?? 0
                          const minimumStock = stock?.minimumStock ?? 0
                          const warningStock = minimumStock * 1.5
                          const isBelowMinimum = availableStock < minimumStock
                          return (
                            <SelectItem
                              key={product.id}
                              value={String(product.id)}
                            >
                              <span>{product.name} </span>

                              <span className={
                                isBelowMinimum
                                  ? "text-red-600"
                                  :
                                availableStock <= warningStock
                                  ? "text-yellow-600"
                                  : ""
                              }>
                                ({availableStock})
                              </span>
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
                <Input
                  type="number"
                  value={String(currentQuantity)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCurrentQuantity(Number(e.target.value || 0))
                  }
                />
              </Field>
            </FieldGroup>
          </div>

          <div className="flex gap-2 items-end">
            <Button
              type="button"
              variant="VFBrown"
              onClick={() => {
                if (!currentProductId) return alert("Seleccione un producto")
                if (currentQuantity <= 0)
                  return alert("Ingrese una cantidad mayor a 0")
                setOrderProducts((prev) => {
                  const existing = prev.find(
                    (p) => p.productId === currentProductId
                  )
                  if (existing) {
                    // merge quantities
                    return prev.map((p) =>
                      p.productId === currentProductId
                        ? { ...p, quantity: p.quantity + currentQuantity }
                        : p
                    )
                  }
                  return [
                    ...prev,
                    { productId: currentProductId, quantity: currentQuantity },
                  ]
                })
                setCurrentProductId(null)
              }}
            >
              Agregar producto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentProductId(null)
                setCurrentQuantity(1)
              }}
            >
              Limpiar selección
            </Button>
          </div>
      </FormCard>

      <SectionCard title="Resumen y cantidad a producir">
        <div className="grid gap-4 border-b border-[#643800]/10 pb-5 sm:grid-cols-2">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#804f17]/75">
              Cliente
            </p>
            <p className="mt-1 font-[family-name:var(--font-heading)] text-lg leading-tight text-neutral-900">
              {selectedCustomerId
                ? customers.find((c) => c.id === selectedCustomerId)?.name
                : "Selecciona un cliente"}
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#804f17]/75">
              Fecha solicitada
            </p>
            <p className="mt-1 font-[family-name:var(--font-heading)] text-lg leading-tight text-neutral-900">
              {formatSpanishDate(date)}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {orderProducts.filter((p) => p.productId).length === 0 ? (
            <EmptyOrderState />
          ) : (
            orderProducts.map((op, i) => {
              if (!op.productId) return null
              const product = products.find((p) => p.id === op.productId)
              const availableStock =
                getPackagedStock(op.productId)?.availableStock ?? 0
              return (
                <OrderItemRow
                  key={op.productId ?? i}
                  item={op}
                  index={i}
                  product={product}
                  availableStock={availableStock}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onRemove={(idx) =>
                    setOrderProducts((prev) =>
                      prev.filter((_, idx2) => idx2 !== idx),
                    )
                  }
                />
              )
            })
          )}
        </div>

        {orderProducts.length > 0 && (
          <div className="mt-5 flex justify-end border-t border-[#643800]/10 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (
                  !confirm("Todos los productos serán eliminados. ¿Continuar?")
                )
                  return
                setOrderProducts([])
              }}
            >
              Vaciar pedido
            </Button>
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
