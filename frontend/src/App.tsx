import {Button} from "@/components/ui/button.tsx";
import {OVCard} from "@/components/OverviewCard.tsx";
import { PiggyBank, ScanBarcode } from "lucide-react"

export default function App() {
  const date = new Date()
  const today = date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <main className={"h-full bg-[#FFF8F5] p-4"}>
      <div className={"mb-8"}>
        <p className={"text-neutral-400"}>{today}</p>
        <h1 className="text-3xl font-bold">Inicio</h1>

        <div className={"flex gap-2"}>
          <Button variant={"VFBrown"}>Nuevo Pedido</Button>
        </div>
      </div>

      <div className={"flex flex-col md:flex-row gap-4"}>
        <OVCard
            icon={<PiggyBank />}
            title={"Ventas Diarias"}
            highlighted={"$67.000"}
        >
          <span>En promedio</span>
        </OVCard>

        <OVCard
            icon={<ScanBarcode />}
            title={"Inventario"}
            highlighted={"92%"}
        >
          <span>Maní sin sal necesita reposición</span>
        </OVCard>
      </div>
    </main>
  )
}
