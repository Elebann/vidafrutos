import { UserPlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"

export function CustomerFormPage() {
  return (
    <PageShell description="Mantencion de clientes mayoristas." icon={UserPlus} title="Nuevo cliente">
      <FormCard submitLabel="Guardar cliente" title="Datos del cliente">
        <TextField label="RUT" placeholder="76.000.000-0" />
        <TextField label="Nombre" placeholder="Nombre del negocio" />
        <TextField label="Direccion" placeholder="Calle, comuna" />
      </FormCard>
    </PageShell>
  )
}