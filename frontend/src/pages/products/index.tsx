import { PackagePlus } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { categories, formatCurrency, products } from "@/data/mock-data"

export function ProductsPage() {
  return (
    <PageShell action={{ icon: PackagePlus, label: "Nuevo producto", to: "/productos/nuevo" }} description="Catalogo comercial y configuracion de categorias." icon={PackagePlus} title="Productos">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Catalogo">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div className="rounded-lg border bg-white p-4" key={product.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-semibold">{product.name}</p>
                  <StatusBadge tone={product.active ? "green" : "neutral"}>{product.active ? "Activo" : "Inactivo"}</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{categories.find((category) => category.id === product.categoryId)?.name}</p>
                <p className="mt-3 text-lg font-semibold">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <FormCard submitLabel="Guardar categoria" title="Nueva categoria">
          <TextField label="Nombre categoria" placeholder="Ej: Snacks premium" />
        </FormCard>
      </div>
    </PageShell>
  )
}