import { PackagePlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { categories } from "@/data/mock-data"

export function ProductFormPage() {
  return (
    <PageShell description="Alta o modificacion de producto comercializable." icon={PackagePlus} title="Nuevo producto">
      <FormCard submitLabel="Guardar producto" title="Datos del producto">
        <TextField label="Nombre" placeholder="Mani salado 250g" />
        <FieldGroup>
          <Field>
            <FieldLabel>Categoria</FieldLabel>
            <Select defaultValue={categories[0]?.id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
