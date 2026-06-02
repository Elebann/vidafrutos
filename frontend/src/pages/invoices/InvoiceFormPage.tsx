import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getCustomer, ensureCustomers, ensureProducts, getOrderTotal } from "@/lib/dataCache"
import apiClients from "@/lib/apiClients"
import type { Order } from "@/types/domain"

interface InvoiceFormPageProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceFormPage({ isOpen, onClose, onSuccess }: InvoiceFormPageProps) {
  const [sentOrders, setSentOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Transferencia")
  const [total, setTotal] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Cargar órdenes cuando se abre el sheet
  useEffect(() => {
    if (!isOpen) return

    // Reset form primero
    setSelectedOrderId("")
    setTotal("")
    setPdfFile(null)
    setError("")
    setPaymentMethod("Transferencia")

    // Luego cargar datos
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
  }, [isOpen])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!selectedOrderId) {
      setError("Selecciona un pedido")
      return
    }
    setIsSubmitting(true)
    try {
      const result = await apiClients.createInvoice({
        orderId: Number(selectedOrderId),
        paymentMethod,
        total: Number(total),
      })
      if (result) {
        const states = await apiClients.fetchOrderStates()
        const confirmedState = states.find((s) => s.state === "Pago confirmado")
        if (confirmedState) {
          await apiClients.updateOrderState(Number(selectedOrderId), confirmedState.id)
        }
        toast.success("El pago se registró correctamente")
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
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
              <Select value={selectedOrderId} onValueChange={(value) => setSelectedOrderId(value ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sentOrders.length === 0 && (
                      <SelectItem value="__none" disabled>
                        No hay pedidos enviados
                      </SelectItem>
                    )}
                    {sentOrders.map((order) => (
                      <SelectItem key={order.id} value={String(order.id)}>
                        Pedido #{order.id} - {getCustomer(order.customerId)?.name ?? `Cliente #${order.customerId}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel>Método de pago</FieldLabel>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["Transferencia", "Efectivo", "Debito", "Credito"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
              <FieldLabel>Adjuntar factura (PDF)</FieldLabel>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setPdfFile(file)
                }}
              />
              {pdfFile && (
                <p className="mt-1 text-sm text-muted-foreground">{pdfFile.name}</p>
              )}
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
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
