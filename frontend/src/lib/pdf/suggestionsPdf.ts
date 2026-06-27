import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import type { Forecast } from "@/types/domain"

interface PdfContext {
  productsById: Map<number, string>
}

function getMondayOfCurrentWeek(date: Date): Date {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  return monday
}

function formatDateToISO(date: Date): string {
  return date.toLocaleDateString("sv-SE")
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function downloadSuggestionsPdf(forecasts: Forecast[], ctx: PdfContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" })
  const today = new Date()
  const generatedAt = today.toLocaleString("es-CL")
  const monday = getMondayOfCurrentWeek(today)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("VidaFrutos — Producción diaria sugerida", 40, 50)

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

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const currentDay = new Date(monday)
    currentDay.setDate(monday.getDate() + dayOffset)
    const targetDate = formatDateToISO(currentDay)

    if (dayOffset > 0) {
      doc.addPage()
    }

    const startY = dayOffset === 0 ? 120 : 40

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(`Plan del ${formatDayName(currentDay)}`, 40, startY + 15)

    const body = sorted
      .filter((f) => f.productionPlan && f.productionPlan.some((p) => p.date === targetDate))
      .map((f) => {
        const productionPlanItem = f.productionPlan?.find((p) => p.date === targetDate)
        const name = f.productName || ctx.productsById.get(f.productId) || `Producto #${f.productId}`
        return [
          name,
          String(f.availableStock ?? 0),
          String(productionPlanItem?.expectedSales ?? 0),
          String(productionPlanItem?.suggestedProduction ?? 0),
        ]
      })

    autoTable(doc, {
      startY: startY + 20,
      head: [["Productos", "Stock Actual", "Ventas esperadas", "Producir"]],
      body: body.length > 0 ? body : [["(sin sugerencias para hoy)", "", "", ""]],
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [128, 79, 23], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      columnStyles: {
        0: { cellWidth: 200 },
        1: { halign: "right", cellWidth: 100 },
        2: { halign: "right", cellWidth: 100 },
        3: { halign: "right", cellWidth: 100 },
      },

    })
  }

  const blob = doc.output("blob")
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}
