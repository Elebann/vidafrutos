import { PageShell } from "@/components/app/page-shell.tsx"
import { Truck } from "lucide-react"

export function DeliveredOrders (){
  return(
    <PageShell title={"Pedidos entregados"} icon={Truck} description="Resumen de pedidos entregados y su estado de pago.">
      <div className="grid gap-3">
        {/* Aquí se mostrarán los pedidos entregados */}
      </div>
    </PageShell>
  )
}