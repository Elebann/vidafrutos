import { Archive } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { ApiProduct } from "@/lib/apiTypes"

export function InventoryUpdatePage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [movementType, setMovementType] = useState<string>("ENTRADA")
  const [gramsValue, setGramsValue] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    apiClients
      .fetchBackendProducts()
      .then((list) => {
        setProducts(list)
        if (list.length > 0) setSelectedProductId(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId)) ?? products[0]
  const gramsNumber = parseFloat(gramsValue || "0")
  const productGrams = Number(selectedProduct?.grams ?? 0)
  const packagedCount = productGrams > 0 ? gramsNumber / productGrams : 0
  const minimumRequired = Number(selectedProduct?.packaged_stock?.minimum_stock ?? 0)
  const gramsValidationMessage =
    gramsValue && packagedCount < minimumRequired
      ? `El valor ingresado no cumple el mínimo requerido para producir ${minimumRequired} unidades (${productGrams} gr. por bolsa.).`
      : null

  async function handleSubmitMovement() {

    if (!selectedProduct) return

    const q = parseFloat(gramsValue || "0")
    if (isNaN(q) || q <= 0) return

    const pid = selectedProduct.id
    const currentRaw = Number(selectedProduct.raw_stock?.total_grams ?? selectedProduct.raw_stock?.quantity_kilogram ?? 0) || 0
    const updatedRaw = movementType === "ENTRADA" ? currentRaw + q : currentRaw - q

    setIsSubmitting(true)
    try {
      try {
        await apiClients.createInventoryMovement({
          productId: pid,
          movementType,
          quantity: q,
          description,
        })
      } catch (err) {
        console.error("Failed to create movement", err)
        alert("No se pudo registrar el movimiento.")
        return
      }

      try {
        await apiClients.updateProductRawStock(pid, updatedRaw)
      } catch (errPatch) {
        console.error("Failed to update raw_stock via PATCH", errPatch)
        alert("Movimiento registrado, pero no se pudo actualizar el stock en crudo.")
      }

      setProducts((prev) => prev.map((p) => (String(p.id) === String(pid) ? { ...p, raw_stock: { ...(p.raw_stock ?? {}), total_grams: updatedRaw } } : p)))

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
