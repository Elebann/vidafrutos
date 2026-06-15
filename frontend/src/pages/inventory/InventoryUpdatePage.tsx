import { Archive, Boxes } from "lucide-react"
import { FormCard, TextField } from "@/components/app/form-card"
import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
import { PageShell } from "@/components/app/page-shell"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { useEffect, useState, type FormEvent } from "react"
import apiClients from "@/lib/apiClients"
import type { ApiProduct } from "@/lib/apiTypes"
import toast from "react-hot-toast"

type PackagedEntry = {
  id: string
  productId: number
  productName: string
  quantity: number
  gramsPerUnit: number
  mermaGrams: number
  comment: string
}

type MovementOption = "ENTRADA" | "SALIDA" | "AJUSTE" | "MERMA"

const MOVEMENT_OPTIONS: readonly MovementOption[] = [
  "ENTRADA",
  // "SALIDA",
  // "AJUSTE",
  "MERMA",
]

export function InventoryUpdatePage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [movementType, setMovementType] = useState<MovementOption>("ENTRADA")
  const [gramsValue, setGramsValue] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [packagedProductId, setPackagedProductId] = useState<string>("")
  const [packagedQuantity, setPackagedQuantity] = useState<string>("")
  const [packagedMermaEnabled, setPackagedMermaEnabled] = useState<boolean>(false)
  const [packagedMermaGrams, setPackagedMermaGrams] = useState<string>("")
  const [packagedComment, setPackagedComment] = useState<string>("")
  const [packagedEntries, setPackagedEntries] = useState<PackagedEntry[]>([])
  const [isSavingPackaged, setIsSavingPackaged] = useState<boolean>(false)

  useEffect(() => {
    apiClients
      .fetchBackendProducts()
      .then((list) => {
        setProducts(list)
        if (list.length > 0) {
          if (!selectedProductId) setSelectedProductId(String(list[0].id))
          if (!packagedProductId) setPackagedProductId(String(list[0].id))
        }
      })
      .catch(() => {})
  }, [])

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId)) ?? products[0]
  const packagedSelectedProduct = products.find((p) => String(p.id) === String(packagedProductId)) ?? products[0]

  const getRawTotalGrams = (product?: ApiProduct) => Number(product?.raw_stock?.total_grams ?? product?.raw_stock?.quantity_kilogram ?? 0) || 0
  const getAvailablePackagedStock = (product?: ApiProduct) => Number(product?.packaged_stock?.available_stock ?? 0) || 0

  function handleAddPackagedEntry() {
    if (!packagedSelectedProduct) return

    const quantity = Number(packagedQuantity || "0")
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Ingresa una cantidad válida para envasar.",{position: "top-center"})
      return
    }

    const gramsPerUnit = Number(packagedSelectedProduct.grams ?? 0)
    if (!Number.isFinite(gramsPerUnit) || gramsPerUnit <= 0) {
      toast.error("El producto seleccionado no tiene gramos por unidad configurados.", {position: "top-center"})
      return
    }

    const mermaGrams = packagedMermaEnabled ? Number(packagedMermaGrams || "0") : 0
    if (packagedMermaEnabled && (!Number.isFinite(mermaGrams) || mermaGrams <= 0)) {
      toast.error("Ingresa una cantidad de merma válida.",{position: "top-center"})
      return
    }

    const productId = Number(packagedSelectedProduct.id)
    const alreadyUsed = packagedEntries
      .filter((entry) => entry.productId === productId)
      .reduce((total, entry) => total + entry.quantity * entry.gramsPerUnit + entry.mermaGrams, 0)

    const requiredRaw = quantity * gramsPerUnit + mermaGrams
    const availableRaw = getRawTotalGrams(packagedSelectedProduct) - alreadyUsed

    if (requiredRaw > availableRaw) {
      toast("No hay suficiente stock de materia prima para este envasado.",{position: "top-center", icon:"⚠️"})
      return
    }

    setPackagedEntries((prev) => [
      ...prev,
      {
        id: `${productId}-${Date.now()}`,
        productId,
        productName: packagedSelectedProduct.name,
        quantity,
        gramsPerUnit,
        mermaGrams,
        comment: packagedComment.trim(),
      },
    ])

    setPackagedQuantity("")
    setPackagedMermaEnabled(false)
    setPackagedMermaGrams("")
    setPackagedComment("")
  }

  function handleRemovePackagedEntry(entryId: string) {
    setPackagedEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  async function handleSavePackaged(event?: FormEvent) {
    event?.preventDefault()

    if (packagedEntries.length === 0) {
      toast("Agrega al menos un producto a la lista.",{position: "top-center", icon:"⚠️"})
      return
    }

    const aggregates = new Map<number, { totalUnits: number; totalRaw: number }>()

    for (const entry of packagedEntries) {
      const current = aggregates.get(entry.productId) ?? { totalUnits: 0, totalRaw: 0 }
      const entryRaw = entry.quantity * entry.gramsPerUnit + entry.mermaGrams
      aggregates.set(entry.productId, {
        totalUnits: current.totalUnits + entry.quantity,
        totalRaw: current.totalRaw + entryRaw,
      })
    }

    const updates = [] as Array<{ productId: number; newAvailable: number; newRaw: number }>
    for (const [productId, aggregate] of aggregates) {
      const product = products.find((p) => Number(p.id) === productId)
      if (!product) continue

      const rawTotal = getRawTotalGrams(product)
      if (aggregate.totalRaw > rawTotal) {
        toast(`El producto ${product.name} no tiene stock suficiente en crudo.`, {position: "top-center", icon:"⚠️"})
        return
      }

      const newAvailable = getAvailablePackagedStock(product) + aggregate.totalUnits
      const newRaw = rawTotal - aggregate.totalRaw
      updates.push({ productId, newAvailable, newRaw })
      toast.success("Stock actualizado con éxito", {position: "top-center"})
    }

    setIsSavingPackaged(true)
    try {
      for (const update of updates) {
        await apiClients.updateProductPackagedStock(update.productId, update.newAvailable)
        await apiClients.updateProductRawStock(update.productId, update.newRaw)
      }

      setProducts((prev) =>
        prev.map((product) => {
          const update = updates.find((item) => Number(product.id) === item.productId)
          if (!update) return product
          return {
            ...product,
            raw_stock: { ...(product.raw_stock ?? {}), total_grams: update.newRaw },
            packaged_stock: { ...(product.packaged_stock ?? {}), available_stock: update.newAvailable },
          }
        })
      )

      setPackagedEntries([])
      setPackagedQuantity("")
      setPackagedMermaEnabled(false)
      setPackagedMermaGrams("")
      setPackagedComment("")
    } catch (error) {
      console.error("Error updating packaged stock", error)
      toast.error("No se pudo guardar el envasado. Intenta nuevamente.",{position: "top-center"})
    } finally {
      setIsSavingPackaged(false)
    }
  }

  async function handleEntrada(
    product: ApiProduct,
    q: number,
    description: string,
  ) {
    const pid = product.id
    const currentRaw = getRawTotalGrams(product)
    const updatedRaw = currentRaw + q

    setIsSubmitting(true)
    try {
      await apiClients.createInventoryMovement({
        productId: pid,
        movementType: "ENTRADA",
        quantity: q,
        description,
      })
      await apiClients.updateProductRawStock(pid, updatedRaw)

      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(pid)
            ? { ...p, raw_stock: { ...(p.raw_stock ?? {}), total_grams: updatedRaw } }
            : p,
        ),
      )

      setGramsValue("")
      setDescription("")
    } catch (err) {
      console.error("Failed ENTRADA movement", err)
      toast.error("No se pudo registrar el movimiento de entrada.", {position: "top-center"})
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMerma(
      product: ApiProduct,
      q: number,
      description: string,
  ){
    const pid = product.id
    const currentRaw = getRawTotalGrams(product)
    const updatedRaw = currentRaw - q

    setIsSubmitting(true)
    try {
      await apiClients.createInventoryMovement({
        productId: pid,
        movementType: "MERMA",
        quantity: q,
        description,
      })
      await apiClients.updateProductRawStock(pid, updatedRaw)

      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(pid)
            ? {
                ...p,
                raw_stock: { ...(p.raw_stock ?? {}), total_grams: updatedRaw },
              }
            : p
        )
      )

      setGramsValue("")
      setDescription("")
    } catch (err) {
      console.error("Failed MERMA movement", err)
      toast.error("No se pudo registrar el movimiento de merma.",{position: "top-center"})
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmitMovement(event?: FormEvent) {
    event?.preventDefault()

    if (!selectedProduct) return

    const q = parseFloat(gramsValue || "0")
    if (isNaN(q) || q <= 0) return toast("Ingrese una cantidad válida.",{position: "top-center", icon:"⚠️"})

    if (movementType === "ENTRADA") {
      await handleEntrada(selectedProduct, q, description)
      toast.success("Se ingresaron correctamente los kilos",{position: "top-center"})
      return
    }

    if (movementType === "SALIDA") {
      // TODO: lógica de SALIDA pendiente

      return
    }

    if (movementType === "AJUSTE") {
      // todo: lo haremos algun dia
      return
    }

    if (movementType === "MERMA") {
      await handleMerma(selectedProduct, q, description)
      toast.success("Merma ingresada correctamente",{position: "top-center"})
      return
    }

  }

  return (
    <PageShell
      description="Ajustes manuales y movimientos de materia prima."
      icon={Archive}
      title="Actualizar inventario"
      action={{
        icon: Boxes,
        label: "Ver Inventario",
        to: "/inventario",
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard
          submitLabel="Registrar movimiento"
          title="Movimiento de materia prima"
          onSubmit={handleSubmitMovement}
          submitDisabled={isSubmitting}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select
                value={String(selectedProductId || "")}
                onValueChange={(v) => setSelectedProductId(String(v))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedProduct?.name ?? "Seleccionar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products
                      .filter((p) => p.active)
                      .map((product) => (
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
              <Select
                value={movementType}
                onValueChange={(v) => setMovementType(v as MovementOption)}
              >
                <SelectTrigger>
                  <SelectValue>{movementType}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {MOVEMENT_OPTIONS.map((t) => (
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
            <TextField
              label="Cantidad gramos"
              type="number"
              value={gramsValue}
              onChange={(v) => setGramsValue(v)}
            />
          </div>
          <TextField
            label="Descripcion"
            placeholder="Motivo del movimiento"
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormCard>

        <FormCard
          submitLabel="Guardar"
          title="Stock envasado"
          onSubmit={handleSavePackaged}
          submitDisabled={isSavingPackaged}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select
                value={String(packagedProductId || "")}
                onValueChange={(v) => setPackagedProductId(String(v))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {packagedSelectedProduct?.name ?? "Seleccionar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products
                      .filter((p) => p.active)
                      .map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <TextField
            label="Cantidad envasada"
            type="number"
            value={packagedQuantity}
            onChange={(v) => setPackagedQuantity(v)}
          />
          {/*<FieldGroup>*/}
          {/*  <Field>*/}
          {/*    <FieldLabel>Merma</FieldLabel>*/}
          {/*    <div className="flex items-center gap-2">*/}
          {/*      <Checkbox*/}
          {/*        checked={packagedMermaEnabled}*/}
          {/*        onCheckedChange={(checked) =>*/}
          {/*          setPackagedMermaEnabled(Boolean(checked))*/}
          {/*        }*/}
          {/*      />*/}
          {/*      <span className="text-sm">Agregar merma</span>*/}
          {/*    </div>*/}
          {/*  </Field>*/}
          {/*</FieldGroup>*/}
          {/*{packagedMermaEnabled && (*/}
          {/*  <TextField*/}
          {/*    label="Cantidad de merma (gr)"*/}
          {/*    type="number"*/}
          {/*    value={packagedMermaGrams}*/}
          {/*    onChange={(v) => setPackagedMermaGrams(v)}*/}
          {/*  />*/}
          {/*)}*/}
          {/*<TextField label="Comentario" placeholder="Detalle opcional" value={packagedComment} onChange={(v) => setPackagedComment(v)} />*/}
          <div className="flex sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPackagedEntry}
            >
              Agregar a la lista
            </Button>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="text-sm font-medium">Resumen</div>
            {packagedEntries.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Sin productos agregados.
              </div>
            ) : (
              <div className="space-y-2">
                {packagedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{entry.productName}</div>
                      <div className="text-muted-foreground">
                        {entry.quantity} un •{" "}
                        {entry.quantity * entry.gramsPerUnit} gr
                        {entry.mermaGrams > 0
                          ? ` + ${entry.mermaGrams} gr merma`
                          : ""}
                        {entry.comment ? ` • ${entry.comment}` : ""}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemovePackagedEntry(entry.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormCard>
      </div>
    </PageShell>
  )
}
