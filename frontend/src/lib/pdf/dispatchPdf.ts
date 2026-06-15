import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Order } from "@/types/domain"

interface PdfContext {
  customersById: Map<number, string>
  productsById: Map<number, string>
}

function formatDateEs(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function downloadDispatchPdf(orders: Order[], ctx: PdfContext): void {
  if (orders.length === 0) return

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" })
  const today = new Date()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  orders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage()
    }

    const customerName = ctx.customersById.get(order.customerId) ?? `Cliente #${order.customerId}`

    // Header
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(`VidaFrutos — Pedido #${order.id}`, 40, 50)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text(`Fecha: ${formatDateEs(new Date(order.date))}`, 40, 72)
    doc.text(`Cliente: ${customerName}`, 40, 90)

    // Separator line
    doc.setDrawColor(128, 79, 23)
    doc.setLineWidth(0.5)
    doc.line(40, 102, pageWidth - 40, 102)

    // Products table
    const body = order.details.map((detail) => {
      const productName = ctx.productsById.get(detail.productId) ?? `Producto #${detail.productId}`
      return [productName, String(detail.quantity)]
    })

    autoTable(doc, {
      startY: 115,
      head: [["Producto", "Cantidad"]],
      body: body.length > 0 ? body : [["(sin productos)", ""]],
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [128, 79, 23], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      columnStyles: {
        0: { cellWidth: 350 },
        1: { halign: "right", cellWidth: 100, fontStyle: "bold" },
      },
    })

    // Footer
    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `VidaFrutos - Página ${index + 1} de ${orders.length}`,
      pageWidth - 40,
      pageHeight - 20,
      { align: "right" },
    )
  })

  const filename = `despacho-${formatDateEs(today).replace(/\//g, "-")}.pdf`
  doc.save(filename)
}
