import { Archive } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { products } from "@/data/mock-data"

export function InventoryUpdatePage() {
  return (
    <PageShell description="Ajustes manuales y movimientos de materia prima." icon={Archive} title="Actualizar inventario">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard submitLabel="Registrar movimiento" title="Movimiento de materia prima">
          <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
          <FieldGroup><Field><FieldLabel>Tipo</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm"><option>ENTRADA</option><option>SALIDA</option><option>AJUSTE</option><option>MERMA</option></select></Field></FieldGroup>
          <TextField label="Cantidad kilos" type="number" />
          <TextField label="Descripcion" placeholder="Motivo del movimiento" />
        </FormCard>
        <FormCard submitLabel="Actualizar stock" title="Stock envasado">
          <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
          <TextField label="Disponible" type="number" />
          <TextField label="Reservado" type="number" />
          <TextField label="Minimo" type="number" />
        </FormCard>
      </div>
    </PageShell>
  )
}