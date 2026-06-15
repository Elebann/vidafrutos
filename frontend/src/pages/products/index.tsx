import { PackagePlus, PackageX, Search } from "lucide-react"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { formatCurrency } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Product, Category } from "@/types/domain"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type FilterStatus = "all" | "active" | "inactive"

function ProductCard({
  product,
  categoryName,
  isToggling,
  onToggleActive,
}: {
  product: Product
  categoryName: string | undefined
  isToggling: boolean
  onToggleActive: (product: Product) => void
}) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#643800]/15 bg-white p-5 shadow-[0_1px_0_rgba(128,79,23,0.04),0_2px_6px_-2px_rgba(128,79,23,0.06)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#804f17]/35 hover:shadow-[0_10px_28px_-12px_rgba(128,79,23,0.25)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[#F2C57C]/0 blur-2xl transition-all duration-700 group-hover:bg-[#F2C57C]/40"
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="pt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#804f17]/75">
            {categoryName ?? "Sin categoría"}
          </span>
          <StatusBadge
            tone={product.active ? "green" : "neutral"}
            onClick={() => onToggleActive(product)}
            disabled={isToggling}
            ariaLabel={
              product.active
                ? `Desactivar ${product.name}`
                : `Activar ${product.name}`
            }
          >
            {product.active ? "Activo" : "Inactivo"}
          </StatusBadge>
        </div>

        <h3 className="font-[family-name:var(--font-heading)] text-[1.45rem] leading-[1.05] tracking-tight text-neutral-900">
          {product.name}
        </h3>

        <p className="-mt-1 text-xs text-neutral-500">
          {product.grams > 0
            ? `${product.grams} g por unidad`
            : "Peso por definir"}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-heading)] text-[1.85rem] leading-none text-[#804f17] tabular-nums">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>
    </article>
  )
}

function EmptyProductsState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#fdf3e8] text-[#804f17] ring-1 ring-[#804f17]/15">
        <PackageX className="size-5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-neutral-700">
          No se encontraron productos
        </p>
        <p className="text-xs text-neutral-500">
          Ajusta los filtros o el término de búsqueda para ver más resultados
        </p>
      </div>
    </div>
  )
}

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
      <div className="grid gap-4">
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categories.find(
                      (category) => category.id === product.categoryId,
                    )?.name}
                    isToggling={togglingId === product.id}
                    onToggleActive={handleToggleActive}
                  />
                ))
              ) : (
                <EmptyProductsState />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
