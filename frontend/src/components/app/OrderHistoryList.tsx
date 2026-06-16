import { MoveRight } from "lucide-react"
import type { OrderHistory } from "@/types/domain"
import { formatDateTime } from "@/lib/format"
import { getHistoryFieldLabel } from "@/lib/historyLabels"

interface OrderHistoryListProps {
  history: OrderHistory[]
  showOrder?: boolean
}

export function OrderHistoryList({ history, showOrder = false }: OrderHistoryListProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin registros.</p>
  }

  return (
    <div className="grid gap-2">
      {history.map((item, idx) => (
        <div
          className="rounded-md border bg-neutral-50 px-3 py-2 text-sm"
          key={`${item.orderId}-${item.date}-${item.field}-${idx}`}
        >
          <div className="">
            {showOrder && (
              <span className="text-VFBrown text-lg">Pedido #{item.orderId}</span>
            )}

            <p className="flex gap-1">
              {getHistoryFieldLabel(item.field)}: {item.previousValue}
              <MoveRight size={20} className="mx-2 text-VFBrown" />
              {item.newValue}
            </p>
          </div>
          <div className="flex flex-col justify-between md:flex-row text-neutral-500">
            <p>Responsable: {item.user}</p>
            <p>{formatDateTime(item.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
