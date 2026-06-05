import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import apiClients from "@/lib/apiClients"
import { uploadToCloudinary, getExtensionFromFileName } from "@/lib/cloudinary"
import type { Order } from "@/types/domain"

interface ShipmentRegistrationFormProps {
  order: Order
  onSuccess: () => void
  onClose: () => void
}

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "pdf"])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

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
    if (!file) return

    const extension = getExtensionFromFileName(file.name)
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setError(`Formato no permitido (.${extension}). Usa: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}.`)
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("El archivo excede el tamaño máximo de 10 MB.")
      return
    }

    setPhotoFile(file)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!orderNumber) {
      setError("Ingresa el número del pedido")
      return
    }

    if (Number(orderNumber) !== order.id) {
      setError(`El número del pedido no coincide. Este es el pedido #${order.id}`)
      return
    }

    if (!photoFile) {
      setError("Selecciona un archivo de evidencia")
      return
    }

    setIsSubmitting(true)
    try {
      // 1) Upload file directly to Cloudinary from the browser
      const cloudinaryResult = await uploadToCloudinary(photoFile)

      // 2) Persist the Cloudinary reference in our backend
      const evidence = await apiClients.uploadDeliveryEvidence(order.id, {
        publicId: cloudinaryResult.publicId,
        extension: cloudinaryResult.extension,
        bytes: cloudinaryResult.bytes,
        evidence_type: 1
      })

      if (!evidence) {
        setError("La evidencia se subió a Cloudinary, pero no se pudo registrar en el sistema.")
        setIsSubmitting(false)
        return
      }

      // 3) Update order state to "Enviado"
      const states = await apiClients.fetchOrderStates()
      const dispatchedState = states.find((s) => s.state === "Enviado")

      if (!dispatchedState) {
        setError("No se encontró el estado 'Enviado'")
        setIsSubmitting(false)
        return
      }

      await apiClients.updateOrderState(order.id, dispatchedState.id)

      // Reset form and close
      setOrderNumber("")
      setPhotoFile(null)
      onSuccess()
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : "Error al registrar el envío"
      setError(message)
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
          <FieldLabel>Evidencia de entrega (imagen o PDF)</FieldLabel>
          <Input
            type="file"
            accept="image/*,application/pdf"
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
          {isSubmitting ? "Subiendo..." : "Registrar envío"}
        </Button>
      </div>
    </form>
  )
}
