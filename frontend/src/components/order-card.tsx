import { Link } from "react-router-dom"
import { StatusBadge, type BadgeTone } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { getCustomer, getMissingUnits, getOrderTotal } from "@/lib/dataCache"
import { formatCurrency } from "@/lib/format"
import type { Order } from "@/types/domain"
import { ProductLine } from "./app/ProductLine"

function orderTone(state: string): BadgeTone {
  if (state === "En produccion") return "yellow"
  if (state === "Listo para despacho") return "blue"
  if (state === "Enviado") return "purple"
  if (state === "Pago confirmado") return "green"
  return "neutral"
}

export function OrderCard({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  const hasMissing = order.details.some((detail) => getMissingUnits(detail.productId, detail.quantity) > 0)

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Pedido #{order.id}</p>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </div>
        <StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge>
      </div>
      <div className="mb-3 grid gap-2">{order.details.slice(0, 2).map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold mr-auto">{formatCurrency(getOrderTotal(order))}</span>
        {hasMissing && <StatusBadge tone="red">Con faltantes</StatusBadge>}
        <Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

export function OrderRow({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  return (
    <>
      <td className="px-4 py-3 font-medium">#{order.id}</td>
      <td className="px-4 py-3">{customer?.name}</td>
      <td className="px-4 py-3"><StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge></td>
      <td className="px-4 py-3 font-medium">{formatCurrency(getOrderTotal(order))}</td>
      <td className="px-4 py-3"><Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">Ver</Button></td>
    </>
  )
}