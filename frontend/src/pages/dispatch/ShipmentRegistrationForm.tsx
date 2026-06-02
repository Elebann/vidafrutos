import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"

interface ShipmentRegistrationFormProps {
  order: Order
  onSuccess: () => void
  onClose: () => void
}

export function ShipmentRegistrationForm({
  order,
  onSuccess,
  onClose,
}: ShipmentRegistrationFormProps) {
  const [orderNumber, setOrderNumber] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate order number matches
    if (!orderNumber) {
      setError("Ingresa el número del pedido")
      return
    }

    if (Number(orderNumber) !== order.id) {
      setError(`El número del pedido no coincide. Este es el pedido #${order.id}`)
      return
    }

    if (!photoFile) {
      setError("Selecciona una foto")
      return
    }

    setIsSubmitting(true)
    try {
      // Get the state ID for "Despachado"
      const states = await apiClients.fetchOrderStates()
      const dispatchedState = states.find((s) => s.state === "Enviado")

      if (!dispatchedState) {
        setError("No se encontró el estado 'Enviado'")
        setIsSubmitting(false)
        return
      }

      // Update order state
      await apiClients.updateOrderState(order.id, dispatchedState.id)

      // Show success message
      alert("El pedido se registró como enviado")

      // Reset form and close
      setOrderNumber("")
      setPhotoFile(null)
      onSuccess()
    } catch (err) {
      console.error(err)
      setError("Error al registrar el envío")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Número de pedido</FieldLabel>
          <Input
            type="number"
            placeholder={`Confirma el número de pedido`}
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value)
              setError("")
            }}
            disabled={isSubmitting}
          />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel>Foto de entrega</FieldLabel>
          <Input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={isSubmitting}
          />
          {photoFile && (
            <p className="mt-2 text-sm text-muted-foreground">
              Archivo seleccionado: {photoFile.name}
            </p>
          )}
        </Field>
      </FieldGroup>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !orderNumber || !photoFile}
          className="flex-1"
        >
          {isSubmitting ? "Procesando..." : "Registrar envío"}
        </Button>
      </div>
    </form>
  )
}
