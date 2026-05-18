import { SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { getProduct, movements } from "@/data/mock-data"

export function MovementsSection() {
  return (
    <SectionCard title="Historial de movimientos">
      <div className="grid gap-2">
        {movements.map((movement) => (
          <div className="grid gap-1 rounded-md border bg-neutral-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center" key={movement.id}>
            <div>
              <p className="font-medium">{getProduct(movement.productId)?.name} - {movement.description}</p>
              <p className="text-xs text-muted-foreground">{movement.date}</p>
            </div>
            <StatusBadge tone={movement.movementType === "MERMA" ? "red" : movement.movementType === "ENTRADA" ? "green" : "yellow"}>
              {movement.movementType} {movement.quantity}
            </StatusBadge>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}