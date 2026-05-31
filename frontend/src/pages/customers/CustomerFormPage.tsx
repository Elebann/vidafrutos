import { UserPlus } from "lucide-react"
import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { useState } from "react"
import apiClients from "@/lib/apiClients"

export function CustomerFormPage() {
  const [rut, setRut] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    if (!rut || !name) return alert('RUT y nombre son requeridos')
    setIsSubmitting(true)
    try {
      const created = await apiClients.createCustomer({ rut, name, address })
      if (created) {
        alert('Cliente creado (id: ' + created.id + ')')
        setRut("")
        setName("")
        setAddress("")
      } else {
        alert('Error creando cliente')
      }
    } catch (err) {
      console.error(err)
      alert('Error creando cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell description="Mantencion de clientes mayoristas." icon={UserPlus} title="Nuevo cliente">
      <FormCard onSubmit={onSubmit} submitLabel="Guardar cliente" title="Datos del cliente" submitDisabled={isSubmitting}>
        <TextField label="RUT" placeholder="76222333-0" value={rut} onChange={setRut} />
        <TextField label="Nombre" placeholder="Nombre del negocio" value={name} onChange={setName} />
        <TextField label="Direccion" placeholder="Calle, comuna" value={address} onChange={setAddress} />
      </FormCard>
    </PageShell>
  )
}
