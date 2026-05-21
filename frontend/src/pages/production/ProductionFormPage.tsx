import { Factory } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { products } from "@/data/mock-data"

export function ProductionFormPage() {
  return (
    <PageShell description="Registro de envasado diario y consumo de materia prima." icon={Factory} title="Registrar produccion">
      <FormCard submitLabel="Registrar produccion" title="Produccion diaria">
        <FieldGroup>
          <Field>
            <FieldLabel>Producto</FieldLabel>
            <Select defaultValue={products.filter((product) => product.active)[0]?.id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {products.filter((product) => product.active).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <TextField label="Cantidad producida" type="number" />
        <TextField label="Consumo materia prima (kg)" type="number" />
        <TextField label="Observacion" placeholder="Lote, turno o comentario" />
      </FormCard>
    </PageShell>
  )
}
