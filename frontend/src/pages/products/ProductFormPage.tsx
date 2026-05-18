import { PackagePlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { categories } from "@/data/mock-data"

export function ProductFormPage() {
  return (
    <PageShell description="Alta o modificacion de producto comercializable." icon={PackagePlus} title="Nuevo producto">
      <FormCard submitLabel="Guardar producto" title="Datos del producto">
        <TextField label="Nombre" placeholder="Mani salado 250g" />
        <FieldGroup>
          <Field>
            <FieldLabel>Categoria</FieldLabel>
            <select className="h-10 rounded-lg border bg-white px-3 text-sm">{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select>
          </Field>
        </FieldGroup>
        <TextField label="Precio" placeholder="1850" type="number" />
        <TextField label="Stock minimo" placeholder="200" type="number" />
        <FieldGroup>
          <Field className="rounded-lg border bg-white p-3" orientation="horizontal">
            <Checkbox defaultChecked />
            <FieldLabel>Producto activo</FieldLabel>
          </Field>
        </FieldGroup>
      </FormCard>
    </PageShell>
  )
}