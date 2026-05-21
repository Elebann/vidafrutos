import { Archive } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { products } from "@/data/mock-data"

export function InventoryUpdatePage() {
  return (
    <PageShell description="Ajustes manuales y movimientos de materia prima." icon={Archive} title="Actualizar inventario">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard submitLabel="Registrar movimiento" title="Movimiento de materia prima">
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select defaultValue={String(products[0]?.id)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo</FieldLabel>
               <Select defaultValue="ENTRADA">
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectGroup>
                     {['ENTRADA','SALIDA','AJUSTE','MERMA'].map((t) => (
                       <SelectItem key={t} value={t}>{t}</SelectItem>
                     ))}
                   </SelectGroup>
                 </SelectContent>
               </Select>
            </Field>
          </FieldGroup>
          <TextField label="Cantidad kilos" type="number" />
          <TextField label="Descripcion" placeholder="Motivo del movimiento" />
        </FormCard>
        <FormCard submitLabel="Actualizar stock" title="Stock envasado">
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
               <Select defaultValue={String(products[0]?.id)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectGroup>
                     {products.map((product) => (
                       <SelectItem key={product.id} value={String(product.id)}>
                         {product.name}
                       </SelectItem>
                     ))}
                   </SelectGroup>
                 </SelectContent>
               </Select>
            </Field>
          </FieldGroup>
          <TextField label="Disponible" type="number" />
          <TextField label="Reservado" type="number" />
          <TextField label="Minimo" type="number" />
        </FormCard>
      </div>
    </PageShell>
  )
}
