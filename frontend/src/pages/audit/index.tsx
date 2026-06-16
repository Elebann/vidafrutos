import { FileClock } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { useEffect, useState, useCallback } from "react"
import apiClients from "@/lib/apiClients"
import type { OrderHistory } from "@/types/domain"
import { MovementsSection } from "@/pages/inventory/MovementsSection"
import { Button } from "@/components/ui/button"
import { OrderHistoryList } from "@/components/app/OrderHistoryList"

export function AuditPage() {
  const [history, setHistory] = useState<OrderHistory[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  const loadHistory = useCallback(async (p: number) => {
    setLoading(true)
    const data = await apiClients.fetchAllHistory(p, pageSize)
    setHistory(data.results)
    setTotalCount(data.count)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadHistory(page)
  }, [page, loadHistory])

  return (
    <PageShell description="Trazabilidad de pedidos y movimientos de inventario." icon={FileClock} title="Auditoria">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cambios de pedidos">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <OrderHistoryList history={history} showOrder />
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {totalCount} registros - Pagina {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
        <MovementsSection />
      </div>
    </PageShell>
  )
}
