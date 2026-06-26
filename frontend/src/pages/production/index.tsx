import { FileBarChart2, FileDown, Loader2, Printer, RefreshCcw, Sparkles, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge, type BadgeTone } from "@/components/app/status-badge"
import apiClients from "@/lib/apiClients"
import { ensureProducts, getProduct } from "@/lib/dataCache"
import { downloadSuggestionsPdf } from "@/lib/pdf/suggestionsPdf"
import type { Forecast, ForecastDiagnostics } from "@/types/domain"
import { useAuth } from "@/hooks/use-auth"
import {
  formatDateLong,
  formatDateTime,
  formatDateTimeFromEpoch,
} from "@/lib/format"

function riskTone(risk: Forecast["risk"]): BadgeTone {
  if (risk === "Alto") return "red"
  if (risk === "Medio") return "yellow"
  return "green"
}

function confidenceTone(value: number): BadgeTone {
  if (value >= 75) return "green"
  if (value >= 50) return "yellow"
  return "red"
}

export function ProductionPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false)
  const [diagnostics, setDiagnostics] = useState<ForecastDiagnostics | null>(null)
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false)
  const [lastTrainedAt, setLastTrainedAt] = useState<number | null>(null)
  const [lastTrainedIso, setLastTrainedIso] = useState<string | null>(null)
  const { user } = useAuth()

  const isAdmin = user?.rol === 1

  async function loadForecasts(silent = false) {
    if (!silent) setIsLoading(true)
    try {
      const [list, status] = await Promise.all([
        apiClients.fetchForecasts(),
        apiClients.fetchForecastStatus(),
      ])
      setForecasts(list)
      setLastTrainedAt(status.lastTrainedAt)
      setLastTrainedIso(status.lastTrainedIso)
    } catch (error) {
      console.error("Error cargando sugerencias", error)
      if (!silent) toast.error("No se pudieron cargar las sugerencias")
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    ensureProducts().catch(() => {})
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadForecasts().catch(() => {})
  }, [])

  const suggestions = useMemo(
    () => forecasts.filter((f) => f.suggestedProduction > 0),
    [forecasts],
  )

  const totalUnits = useMemo(
    () => suggestions.reduce((sum, f) => sum + f.suggestedProduction, 0),
    [suggestions],
  )

  function handleDownloadPdf() {
    if (forecasts.length === 0) {
      toast.error("Aun no hay sugerencias para descargar")
      return
    }
    const productsById = new Map<number, string>()
    for (const f of forecasts) {
      const product = getProduct(f.productId)
      productsById.set(f.productId, f.productName || product?.name || `Producto #${f.productId}`)
    }
    try {
      downloadSuggestionsPdf(forecasts, { productsById })
      toast.success("PDF descargado")
    } catch (error) {
      console.error("Error generando PDF", error)
      toast.error("No se pudo generar el PDF")
    }
  }

  async function handleRetrain() {
    setIsTraining(true)
    try {
      const result = await apiClients.trainForecasts()
      setForecasts(result.suggestions)
      setLastTrainedAt(result.status.lastTrainedAt)
      setLastTrainedIso(result.status.lastTrainedIso)
      toast.success(`Modelo reentrenado en ${result.elapsedSeconds.toFixed(1)} s`)
    } catch (error) {
      console.error("Error reentrenando", error)
      toast.error("No se pudo reentrenar el modelo")
    } finally {
      setIsTraining(false)
    }
  }

  async function handleOpenDiagnostics() {
    setIsDiagnosticsOpen(true)
    setIsDiagnosticsLoading(true)
    try {
      const data = await apiClients.fetchForecastDiagnostics()
      setDiagnostics(data)
    } catch (error) {
      console.error("Error cargando diagnostico", error)
      toast.error("No se pudo cargar el diagnostico")
    } finally {
      setIsDiagnosticsLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const lastTrainedLabel = (() => {
    if (lastTrainedAt) return formatDateTimeFromEpoch(lastTrainedAt)
    if (lastTrainedIso) return formatDateTime(lastTrainedIso)
    return "Aún no entrenado"
  })()

  return (
    <PageShell
      action={{ icon: Sparkles, label: "Registrar produccion", to: "/inventario/actualizar" }}
      description="Planificacion diaria basada en faltantes y demanda esperada."
      icon={FileBarChart2}
      title="Producción"
    >
      <div className="grid gap-2">
        <SectionCard
          title="Sugerencias de producción"
          description={`Modelo reentrenado por ultima vez: ${lastTrainedLabel}`}
        >
          <div className="mb-3 flex flex-col flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              {isLoading
                ? "Calculando.."
                : `${suggestions.length} productos a producir (${totalUnits} unidades)`}
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isLoading || forecasts.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#643800]/30 bg-white px-3 text-xs font-medium text-[#643800] transition hover:bg-[#fff8f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileDown className="size-3.5" />
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={handleRetrain}
                disabled={isTraining}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#643800]/30 bg-white px-3 text-xs font-medium text-[#643800] transition hover:bg-[#fff8f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTraining ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                Reentrenar
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenDiagnostics}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#643800]/30 bg-white px-3 text-xs font-medium text-[#643800] transition hover:bg-[#fff8f3]"
                >
                  <FileBarChart2 className="size-3.5" />
                  Diagnostico admin
                </button>
              )}
            </div>
            <p className="text-neutral-400 text-xs">Versión del algoritmo: v0.1</p>
          </div>

          <div className="grid gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Entrenando modelo y calculando sugerencias...
              </div>
            )}

            {!isLoading && suggestions.length === 0 && (
              <p className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                No se requiere produccion adicional hoy. El stock actual cubre la demanda esperada.
              </p>
            )}

            {suggestions.map((forecast) => {
              const product = getProduct(forecast.productId)
              return (
                <div
                  key={forecast.productId}
                  className="grid gap-2 rounded-md bg-neutral-50 px-3 py-2 text-sm sm:grid-cols-1 sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {forecast.productName || product?.name || `Producto #${forecast.productId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock actual: {forecast.availableStock ?? 0} · Ventas esperadas: {forecast.expectedSales}
                    </p>
                    {forecast.productionPlan && forecast.productionPlan.length > 0 && (
                      <div className="mt-2 grid gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {forecast.productionPlan.map((day) => (
                          <div
                            key={`${forecast.productId}-${day.date}`}
                            className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 text-[11px]"
                          >
                            <span className="font-medium text-neutral-700">
                              {formatDateLong(day.date)}
                            </span>
                            <span className="text-muted-foreground">
                              V {day.expectedSales} / P {day.suggestedProduction}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded bg-white px-2 py-1">
                    <strong className="block text-base leading-none text-[#804f17]">
                      {forecast.suggestedProduction}
                    </strong>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Producir</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <StatusBadge tone={riskTone(forecast.risk)}>Riesgo {forecast.risk}</StatusBadge>
                    <StatusBadge tone={confidenceTone(forecast.confidence)}>
                      Confianza {forecast.confidence.toFixed(1)}%
                    </StatusBadge>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {isDiagnosticsOpen && isAdmin && (
        <DiagnosticsModal
          diagnostics={diagnostics}
          isLoading={isDiagnosticsLoading}
          onClose={() => setIsDiagnosticsOpen(false)}
          onPrint={handlePrint}
        />
      )}
    </PageShell>
  )
}

interface DiagnosticsModalProps {
  diagnostics: ForecastDiagnostics | null
  isLoading: boolean
  onClose: () => void
  onPrint: () => void
}

function DiagnosticsModal({ diagnostics, isLoading, onClose, onPrint }: DiagnosticsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-white print:p-0"
      role="dialog"
      aria-label="Diagnostico del modelo de prediccion"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-2xl print:max-h-none print:w-full print:max-w-none print:overflow-visible print:shadow-none">
        <div className="flex items-center justify-between border-b px-5 py-3 print:hidden">
          <div>
            <h2 className="text-base font-semibold text-[#643800]">Diagnostico del modelo</h2>
            <p className="text-xs text-muted-foreground">Matriz de confusion y tabla de confianza</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#643800]/30 bg-white px-3 text-xs font-medium text-[#643800] transition hover:bg-[#fff8f3]"
            >
              <Printer className="size-3.5" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#643800]/30 bg-white text-[#643800] transition hover:bg-[#fff8f3]"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Calculando diagnostico del modelo...
            </div>
          )}

          {diagnostics && !isLoading && (
            <>
              <section className="rounded-md border border-[#643800]/15 bg-[#fff8f3] px-3 py-2">
                <p className="text-xs leading-relaxed text-[#5b4a3b]">
                  <strong className="font-semibold text-[#643800]">¿Qué es la confianza?</strong> Porcentaje
                  de veces que un intervalo de prediccion del mismo ancho relativo (incertidumbre entre
                  los 300 arboles) contuvo el valor real durante el entrenamiento.
                  <span className="ml-1 font-medium text-[#643800]">≥70% Alta</span> ·
                  <span className="ml-1 font-medium text-[#a87a3a]">50-69% Media</span> ·
                  <span className="ml-1 font-medium text-[#9a4a2a]">&lt;50% Baja</span>.
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#643800]">Resumen del modelo</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <SummaryRow label="Entrenado" value={diagnostics.summary.trained ? "Si" : "No"} />
                  <SummaryRow
                    label="Ultimo entrenamiento"
                    value={
                      diagnostics.summary.lastTrainedAt
                        ? formatDateTimeFromEpoch(diagnostics.summary.lastTrainedAt)
                        : diagnostics.summary.lastTrainedIso
                          ? formatDateTime(diagnostics.summary.lastTrainedIso)
                          : "-"
                    }
                  />
                  <SummaryRow label="Filas de entrenamiento" value={String(diagnostics.summary.nRows)} />
                  <SummaryRow label="Productos entrenados" value={String(diagnostics.summary.nProducts)} />
                  <SummaryRow
                    label="Configuracion RF"
                    value={`${diagnostics.summary.nEstimators} arboles, profundidad ${diagnostics.summary.maxDepth}`}
                  />
                  <SummaryRow
                    label="Ventana de entrenamiento"
                    value={`${diagnostics.summary.lookbackDays} dias`}
                  />
                  <SummaryRow label="MAE (test)" value={diagnostics.summary.testMae.toFixed(2)} />
                  <SummaryRow label="R2 (test)" value={diagnostics.summary.testR2.toFixed(3)} />
                  <SummaryRow label="MAPE (test)" value={`${diagnostics.summary.testMape.toFixed(1)}%`} />
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#643800]">Matriz de confusion</h3>
                <p className="mb-2 text-xs text-muted-foreground">
                  Filas: clase real. Columnas: clase predicha. Las clases separan dias sin venta,
                  ventas normales y ventas altas segun la demanda historica no-cero.
                </p>
                <ConfusionMatrix data={diagnostics.confusionMatrix} />
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#643800]">Metricas de clasificacion</h3>
                <p className="mb-2 text-xs text-muted-foreground">
                  Accuracy, recall, precision y F1 score calculados sobre las clases operacionales del
                  conjunto de validacion historico.
                </p>
                <MetricsTable rows={diagnostics.summary.classificationMetrics} />
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#643800]">Tabla de confianza por producto</h3>
                <p className="mb-2 text-xs text-muted-foreground">
                  Una fila por producto (la fecha mas reciente del conjunto de validacion). Compara ventas
                  reales vs predichas, intervalo al 95% y porcentaje de confianza calibrado. La columna
                  "Dentro" indica si el valor real cae dentro del intervalo.
                </p>
                <ConfidenceTable rows={diagnostics.confidenceTable} />
              </section>

              {diagnostics.summary.topFeatures.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-[#643800]">Top features del modelo</h3>
                  <ul className="grid gap-1 text-xs text-neutral-700 sm:grid-cols-2">
                    {diagnostics.summary.topFeatures.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-2 py-1"
                      >
                        <span className="font-mono">{feature.name}</span>
                        <span className="font-semibold text-[#643800]">
                          {(feature.importance * 100).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  )
}

function ConfusionMatrix({ data }: { data: ForecastDiagnostics["confusionMatrix"] }) {
  const { labels, matrix, edges } = data
  const edgeLabels = edges && edges.length === labels.length - 1
    ? labels.map((_label, idx) => {
        const label = labels[idx]
        if (idx === 0) return `${label} (0)`
        if (idx === labels.length - 1) return label
        return label
      })
    : labels

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left font-medium text-neutral-700">
              Real \ Predicho
            </th>
            {edgeLabels.map((label, idx) => (
              <th
                key={idx}
                className="border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-center font-medium text-neutral-700"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={rIdx}>
              <th className="border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left font-medium text-neutral-700">
                {edgeLabels[rIdx]}
              </th>
              {row.map((value, cIdx) => {
                const isDiagonal = rIdx === cIdx
                return (
                  <td
                    key={cIdx}
                    className={`border border-neutral-200 px-2 py-1.5 text-center ${
                      isDiagonal ? "bg-emerald-50 font-semibold text-emerald-700" : "bg-white"
                    }`}
                  >
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetricsTable({ rows }: { rows: ForecastDiagnostics["summary"]["classificationMetrics"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay metricas suficientes.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-neutral-50">
            <th className="border border-neutral-200 px-2 py-1.5 text-left">Clase</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Accuracy</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Recall</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Precision</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">F1 score</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Soporte</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.className} className="hover:bg-neutral-50">
              <td className="border border-neutral-200 px-2 py-1 font-medium">{row.className}</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{(row.accuracy * 100).toFixed(1)}%</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{(row.recall * 100).toFixed(1)}%</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{(row.precision * 100).toFixed(1)}%</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{(row.f1Score * 100).toFixed(1)}%</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{row.support}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConfidenceTable({ rows }: { rows: ForecastDiagnostics["confidenceTable"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos suficientes.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-neutral-50">
            <th className="border border-neutral-200 px-2 py-1.5 text-left">Fecha</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-left">Producto</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Real</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Predicho</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">IC 95%</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-right">Confianza</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-center">Clase real</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-center">Clase predicha</th>
            <th className="border border-neutral-200 px-2 py-1.5 text-center">Dentro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-neutral-50">
              <td className="border border-neutral-200 px-2 py-1">{row.date}</td>
              <td className="border border-neutral-200 px-2 py-1">{row.productName || `#${row.productId}`}</td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{row.actual}</td>
              <td className="border border-neutral-200 px-2 py-1 text-right font-semibold">{row.predicted}</td>
              <td className="border border-neutral-200 px-2 py-1 text-right text-muted-foreground">
                [{row.lower} - {row.upper}]
              </td>
              <td className="border border-neutral-200 px-2 py-1 text-right">{row.confidence.toFixed(1)}%</td>
              <td className="border border-neutral-200 px-2 py-1 text-center">{row.actualClass}</td>
              <td className="border border-neutral-200 px-2 py-1 text-center">{row.predictedClass}</td>
              <td className="border border-neutral-200 px-2 py-1 text-center">
                {row.insideInterval ? (
                  <StatusBadge tone="green">Si</StatusBadge>
                ) : (
                  <StatusBadge tone="red">No</StatusBadge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
