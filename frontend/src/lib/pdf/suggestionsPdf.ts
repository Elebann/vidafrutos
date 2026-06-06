import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import type { Forecast } from "@/types/domain"

interface PdfContext {
  productsById: Map<number, string>
}

function formatDateEs(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatConfidence(value: number): string {
  return `${value.toFixed(1)}%`
}

export function downloadSuggestionsPdf(forecasts: Forecast[], ctx: PdfContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" })
  const today = new Date()
  const generatedAt = today.toLocaleString("es-CL")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("VidaFrutos — Produccion diaria sugerida", 40, 50)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Generado: ${generatedAt}`, 40, 70)
  doc.text("Modelo: Random ForestRegressor (sklearn) — ventas 90 dias", 40, 84)

  const sorted = [...forecasts].sort((a, b) => b.suggestedProduction - a.suggestedProduction)
  const totalUnits = sorted.reduce((sum, f) => sum + f.suggestedProduction, 0)
  const highRisk = sorted.filter((f) => f.risk === "Alto").length
  doc.text(
    `Total unidades a producir: ${totalUnits}  |  Productos con riesgo alto: ${highRisk}  |  Sugerencias: ${sorted.length}`,
    40,
    100,
  )

  const body = sorted.map((f) => {
    const name = f.productName || ctx.productsById.get(f.productId) || `Producto #${f.productId}`
    return [
      name,
      String(f.availableStock ?? 0),
      String(f.expectedSales),
      String(f.suggestedProduction),
      f.risk,
      formatConfidence(f.confidence),
    ]
  })

  autoTable(doc, {
    startY: 120,
    head: [["Producto", "Stock actual", "Ventas esperadas", "Producir", "Riesgo", "Confianza"]],
    body: body.length > 0 ? body : [["(sin sugerencias para hoy)", "", "", "", "", ""]],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [128, 79, 23], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 245, 240] },
    columnStyles: {
      0: { cellWidth: 200 },
      1: { halign: "right", cellWidth: 70 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 60, fontStyle: "bold" },
      4: { halign: "center", cellWidth: 60 },
      5: { halign: "right", cellWidth: 60 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(
        `VidaFrutos - Pagina ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      )
    },
  })

  const filename = `produccion-sugerida-${formatDateEs(today).replace(/\//g, "-")}.pdf`
  doc.save(filename)
}
