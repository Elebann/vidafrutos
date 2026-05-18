import { Factory } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { products } from "@/data/mock-data"

export function ProductionFormPage() {
  return (
    <PageShell description="Registro de envasado diario y consumo de materia prima." icon={Factory} title="Registrar produccion">
      <FormCard submitLabel="Registrar produccion" title="Produccion diaria">
        <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.filter((product) => product.active).map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
        <TextField label="Cantidad producida" type="number" />
        <TextField label="Consumo materia prima (kg)" type="number" />
        <TextField label="Observacion" placeholder="Lote, turno o comentario" />
      </FormCard>
    </PageShell>
  )
}