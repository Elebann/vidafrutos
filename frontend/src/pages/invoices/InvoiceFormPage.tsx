import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { Receipt, ChevronDown, X } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpenCombo, setIsOpenCombo] = useState(false)
  const comboRef = useRef<HTMLDivElement>(null)

  function resetForm() {
    setSelectedOrderId("")
    setPaymentMethod("Transferencia")
    setTotal("")
    setPdfFile(null)
    setError("")
    setSearchQuery("")
    setIsOpenCombo(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpenCombo) return
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIsOpenCombo(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpenCombo])

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

  const filteredOrders = sentOrders.filter((order) => {
    if (!searchQuery) return true
    return String(order.id).includes(searchQuery.trim())
  })

  const selectedOrder = sentOrders.find((o) => o.id === Number(selectedOrderId))

  const displayValue = selectedOrder
    ? `Pedido #${selectedOrder.id} - ${getCustomer(selectedOrder.customerId)?.name ?? `Cliente #${selectedOrder.customerId}`}`
    : searchQuery

  const handleSelectOrder = useCallback((order: Order) => {
    setSelectedOrderId(String(order.id))
    setSearchQuery("")
    setIsOpenCombo(false)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedOrderId("")
    setSearchQuery("")
  }, [])

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
        setSentOrders((prev) => prev.filter((o) => o.id !== orderId))
        toast.success("El pago se registró correctamente",{position:"top-center"})
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
              <div ref={comboRef} className="relative">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar por número de pedido..."
                    value={displayValue}
                    onChange={(e) => {
                      setSelectedOrderId("")
                      setSearchQuery(e.target.value)
                      setIsOpenCombo(true)
                    }}
                    onFocus={() => setIsOpenCombo(true)}
                    className="pr-8"
                  />
                  {selectedOrder && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {!selectedOrder && (
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  )}
                </div>
                {isOpenCombo && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-md">
                    {filteredOrders.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No hay pedidos enviados
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent ${selectedOrderId === String(order.id) ? "bg-accent" : ""}`}
                          onClick={() => handleSelectOrder(order)}
                        >
                          Pedido #{order.id} - {getCustomer(order.customerId)?.name ?? `Cliente #${order.customerId}`}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
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
