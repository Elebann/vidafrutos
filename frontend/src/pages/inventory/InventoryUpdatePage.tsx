import { Archive } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import api from "@/lib/api"

export function InventoryUpdatePage() {
  // use the raw backend product objects (they include raw_stock and packaged_stock)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [movementType, setMovementType] = useState<string>("ENTRADA")
  const [gramsValue, setGramsValue] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    api
      .get("/api/products/")
      .then((res) => {
        const list = res.data ?? []
        setProducts(list)
        if (list.length > 0) setSelectedProductId(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId)) ?? products[0]
  // validation: compute how many packaged units would be produced
  const gramsNumber = parseFloat(gramsValue || "0")
  const packagedCount = selectedProduct && selectedProduct.grams ? gramsNumber / selectedProduct.grams : 0
  const minimumRequired = selectedProduct?.packaged_stock?.minimum_stock ?? 0
  const gramsValidationMessage =
    gramsValue && packagedCount < minimumRequired
      ? `El valor ingresado no cumple el mínimo requerido para producir ${minimumRequired} unidades (${selectedProduct.grams} gr. por bolsa.).`
      : null

  async function handleSubmitMovement() {

    if (!selectedProduct) return

    const q = parseFloat(gramsValue || "0")
    if (isNaN(q) || q <= 0) return

    const pid = selectedProduct.id
    const currentRaw = parseFloat((selectedProduct.raw_stock?.total_grams ?? selectedProduct.raw_stock?.quantity_kilogram ?? 0) as any) || 0
    const updatedRaw = movementType === "ENTRADA" ? currentRaw + q : currentRaw - q

    setIsSubmitting(true)
    try {
      const isoDate = new Date().toISOString()
      const movementBody = { product_id: pid, movement_type: movementType, quantity: q, date: isoDate, description: description || "" }
      try {
        await api.post("/api/inventory/movements/", movementBody)
      } catch (err: any) {
        console.error("Failed to create movement", err)
        alert(`Error ${err?.response?.status ?? "no-status"} al registrar movimiento.`)
        return
      }

      // 2) update raw stock on product resource
      // Try POST /api/products (some backends expect this) then PATCH /api/products/{id}/ as fallback
      let rawUpdateSucceeded = false
      try {
        await api.patch(`/api/products/${pid}/`, { raw_stock_total_grams: updatedRaw })
        rawUpdateSucceeded = true
      } catch (errPatch: any) {
        console.error("Failed to update raw_stock via PATCH", errPatch)
        alert("Movimiento registrado, pero no se pudo actualizar el stock en crudo.")
      }

      // 3) update local state to reflect new raw stock
      setProducts((prev: any[]) => prev.map((p) => (String(p.id) === String(pid) ? { ...p, raw_stock: { ...(p.raw_stock ?? {}), total_grams: updatedRaw } } : p)))

      // reset form fields
      setGramsValue("")
      setDescription("")
    } catch (err) {
      console.error(err)
      alert("Error inesperado al registrar movimiento")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell description="Ajustes manuales y movimientos de materia prima." icon={Archive} title="Actualizar inventario">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard submitLabel="Registrar movimiento" title="Movimiento de materia prima" onSubmit={handleSubmitMovement} submitDisabled={isSubmitting}>
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select value={String(selectedProductId || "")} onValueChange={(v) => setSelectedProductId(String(v))}>
                <SelectTrigger>
                  <SelectValue>{selectedProduct?.name ?? "Seleccionar"}</SelectValue>
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
               <Select value={movementType} onValueChange={(v) => setMovementType(String(v))}>
                 <SelectTrigger>
                   <SelectValue>{movementType}</SelectValue>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectGroup>
                     {["ENTRADA", "SALIDA", "AJUSTE", "MERMA"].map((t) => (
                       <SelectItem key={t} value={t}>
                         {t}
                       </SelectItem>
                     ))}
                   </SelectGroup>
                 </SelectContent>
               </Select>
            </Field>
          </FieldGroup>
          <div>
            <TextField label="Cantidad gramos" type="number" value={gramsValue} onChange={(v) => setGramsValue(v)} />
            {gramsValidationMessage && <div className="text-destructive text-sm mt-1">{gramsValidationMessage}</div>}
          </div>
          <TextField label="Descripcion" placeholder="Motivo del movimiento" value={description} onChange={(v) => setDescription(v)} />
        </FormCard>
        <FormCard submitLabel="Actualizar stock" title="Stock envasado">
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
                <Select value={String(selectedProductId || "")} onValueChange={(v) => setSelectedProductId(String(v))}>
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
