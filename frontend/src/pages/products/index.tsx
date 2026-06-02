import { PackagePlus, Search } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { formatCurrency } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Product, Category } from "@/types/domain"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type FilterStatus = "all" | "active" | "inactive"

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    apiClients.fetchProducts().then(setProducts).catch(() => {})
    apiClients.fetchCategories().then(setCategories).catch(() => {})
  }, [])

  async function handleToggleActive(product: Product) {
    if (togglingId !== null) return

    const previousState = product.active
    const newState = !previousState

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: newState } : p)),
    )
    setTogglingId(product.id)

    try {
      const updated = await apiClients.toggleProductActive(product.id, newState)
      if (!updated) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, active: previousState } : p,
          ),
        )
        alert("No se pudo cambiar el estado del producto.")
      }
    } catch (error) {
      console.error("Error toggling product active state", error)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, active: previousState } : p,
        ),
      )
      alert("No se pudo cambiar el estado del producto.")
    } finally {
      setTogglingId(null)
    }
  }

  // Filter products based on search and status
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && product.active) ||
      (filterStatus === "inactive" && !product.active)
    return matchesSearch && matchesStatus
  })

  return (
    <PageShell
      action={{
        icon: PackagePlus,
        label: "Nuevo producto",
        to: "/productos/nuevo",
      }}
      description="Catálogo completo de productos"
      icon={PackagePlus}
      title="Productos"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {/* Search and filter controls */}
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={filterStatus === "all" ? "VFBrown" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Todos
              </Button>
              <Button
                type="button"
                variant={filterStatus === "active" ? "VFBrown" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Activos
              </Button>
              <Button
                type="button"
                variant={filterStatus === "inactive" ? "VFBrown" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("inactive")}
              >
                Inactivos
              </Button>
            </div>
          </div>

          <SectionCard title="Catálogo">
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div className="rounded-lg border bg-white p-4" key={product.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">
                        {product.name}
                      </p>
                      <StatusBadge
                        tone={product.active ? "green" : "neutral"}
                        onClick={() => handleToggleActive(product)}
                        disabled={togglingId === product.id}
                        ariaLabel={
                          product.active
                            ? `Desactivar ${product.name}`
                            : `Activar ${product.name}`
                        }
                      >
                        {product.active ? "Activo" : "Inactivo"}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {
                        categories.find(
                          (category) => category.id === product.categoryId
                        )?.name
                      }
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      {formatCurrency(product.price)}
                    </p>

                    <span className="text-sm text-muted-foreground">
                      {product.grams}gr
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
        <FormCard submitLabel="Guardar categoria" title="Nueva categoria">
          <TextField
            label="Nombre categoria"
            placeholder="Ej: Snacks premium"
          />
        </FormCard>
      </div>
    </PageShell>
  )
}
