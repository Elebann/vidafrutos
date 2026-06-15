import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getCustomer, ensureCustomers, ensureProducts, getOrderTotal } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/format.ts"
import {
  getExtensionFromFileName,
  uploadToCloudinary,
} from "@/lib/cloudinary"

interface InvoiceFormPageProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceFormPage({
    isOpen,
    onClose,
    onSuccess
  }: InvoiceFormPageProps) {
  const [sentOrders, setSentOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Transferencia")
  const [total, setTotal] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  function resetForm() {
    setSelectedOrderId("")
    setPaymentMethod("Transferencia")
    setTotal("")
    setPdfFile(null)
    setError("")
  }

  // Cargar órdenes cuando se abre el sheet
  useEffect(() => {
    ;(async () => {
      try {
        await ensureProducts()
        await ensureCustomers()

        const orders = await apiClients.fetchOrders()
        setSentOrders(orders.filter((o) => o.state === "Enviado"))
      } catch (err) {
        console.error("Error loading orders:", err)
      }
    })()
  }, [])

  // Calcular total cuando cambia la orden seleccionada

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedOrderId) {
      setTotal("")
      return
    }
    const order = sentOrders.find((o) => o.id === Number(selectedOrderId))
    if (!order) {
      setTotal("")
      return
    }
    const calculated = getOrderTotal(order)
    setTotal(String(calculated))
  }, [selectedOrderId, sentOrders])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = getExtensionFromFileName(file.name)

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setError(
        `Formato no permitido (.${extension}). Usa: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}.`
      )
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("El archivo excede el tamaño máximo de 10 MB.")
      return
    }

    setPdfFile(file)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!selectedOrderId) {
      setError("Selecciona un pedido")
      return
    }

    if (!pdfFile) {
      setError("Selecciona un archivo como evidencia de pago")
      return
    }

    setIsSubmitting(true)

    try {
      const orderId = Number(selectedOrderId)

      const cloudinaryResult = await uploadToCloudinary(pdfFile)

      const evidence = await apiClients.uploadDeliveryEvidence(orderId, {
        publicId: cloudinaryResult.publicId,
        extension: cloudinaryResult.extension,
        bytes: cloudinaryResult.bytes,
        evidence_type: 2,
      })

      if (!evidence) {
        setError(
          "La evidencia se subió a Cloudinary, pero no se pudo registrar en el sistema."
        )
        setIsSubmitting(false)
        return
      }

      const result = await apiClients.createInvoice({
        orderId: orderId,
        paymentMethod,
        total: Number(total),
      })
      if (result) {
        const states = await apiClients.fetchOrderStates()
        const confirmedState = states.find((s) => s.state === "Pago confirmado")
        if (confirmedState) {
          await apiClients.updateOrderState(orderId, confirmedState.id)
        }
        toast.success("El pago se registró correctamente")
        resetForm()
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      } else {
        setError("Error al registrar el pago")
      }
    } catch (err) {
      console.error(err)
      setError("Error al registrar el pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            Registrar pago
          </SheetTitle>
          <SheetDescription>Selecciona un pedido enviado y registra su pago.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 p-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Pedido</FieldLabel>
              <select
                className="flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Seleccionar pedido</option>
                {sentOrders.length === 0 && (
                  <option value="" disabled>No hay pedidos enviados</option>
                )}
                {sentOrders.map((order) => (
                  <option key={order.id} value={String(order.id)}>
                    Pedido #{order.id} - {getCustomer(order.customerId)?.name ?? `Cliente #${order.customerId}`}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel>Método de pago</FieldLabel>
              <select
                className="flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {["Transferencia", "Efectivo", "Debito", "Credito"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel>Total del pedido</FieldLabel>
              <Input type="number" value={total} readOnly placeholder="Selecciona un pedido" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel>Adjuntar evidencia de pago</FieldLabel>
              <Input
                type="file"
                onChange={handlePdfChange}
              />
              {pdfFile && (
                <p className="mt-1 text-sm text-muted-foreground">{pdfFile.name}</p>
              )}
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="VFBrown" disabled={isSubmitting || !selectedOrderId} className="flex-1">
              {isSubmitting ? "Procesando..." : "Registrar pago"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
