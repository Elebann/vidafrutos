import type {
  Category,
  Customer,
  Forecast,
  Invoice,
  Order,
  PackagedStock,
  Product,
  RawStock,
  Role,
  StockMovement,
  User,
} from "@/types/domain"

export const categories: Category[] = [
  { id: 1, name: "Mani" },
  { id: 2, name: "Frutos secos" },
  { id: 3, name: "Confites" },
]

export const products: Product[] = [
  { id: 1, categoryId: 1, name: "Mani salado 250g", price: 1850, active: true },
  { id: 2, categoryId: 1, name: "Mani sin sal 250g", price: 1790, active: true },
  { id: 3, categoryId: 2, name: "Mix frutos secos 300g", price: 3490, active: true },
  { id: 4, categoryId: 3, name: "Pasas con chocolate 200g", price: 2290, active: true },
  { id: 5, categoryId: 1, name: "Mani merken 250g", price: 1990, active: false },
]

export const customers: Customer[] = [
  {
    id: 1,
    rut: "76.543.210-8",
    name: "Minimarket Los Aromos",
    address: "Av. Los Aromos 1240, Maipu",
    lastOrderDate: "2026-05-13",
    balance: 0,
  },
  {
    id: 2,
    rut: "77.111.222-3",
    name: "Botilleria Don Pedro",
    address: "Camino Melipilla 8890, Cerrillos",
    lastOrderDate: "2026-05-12",
    balance: 42000,
  },
  {
    id: 3,
    rut: "78.555.100-1",
    name: "Almacen Santa Marta",
    address: "Santa Marta 440, Santiago",
    lastOrderDate: "2026-05-10",
    balance: 0,
  },
]

export const packagedStock: PackagedStock[] = [
  { productId: 1, availableStock: 240, allocatedStock: 96, minimumStock: 200 },
  { productId: 2, availableStock: 84, allocatedStock: 72, minimumStock: 200 },
  { productId: 3, availableStock: 118, allocatedStock: 40, minimumStock: 100 },
  { productId: 4, availableStock: 52, allocatedStock: 35, minimumStock: 100 },
  { productId: 5, availableStock: 0, allocatedStock: 0, minimumStock: 100 },
]

export const rawStock: RawStock[] = [
  { productId: 1, quantityKilogram: 63.4 },
  { productId: 2, quantityKilogram: 41.7 },
  { productId: 3, quantityKilogram: 22.1 },
  { productId: 4, quantityKilogram: 18.8 },
]

export const roles: Role[] = [
  { id: 1, name: "Administracion", permissions: ["Usuarios", "Reportes", "Facturacion", "Configuracion"] },
  { id: 2, name: "Ventas", permissions: ["Pedidos", "Clientes", "Facturas"] },
  { id: 3, name: "Produccion", permissions: ["Inventario", "Produccion", "Despacho"] },
]

export const users: User[] = [
  { id: 1, rut: "19.234.567-8", username: "evan", name: "Evan Reyes", roleId: 1, active: true },
  { id: 2, rut: "20.111.222-5", username: "josefa", name: "Josefa Aravena", roleId: 2, active: true },
  { id: 3, rut: "15.444.987-0", username: "produccion", name: "Taller Vida Frutos", roleId: 3, active: true },
]

export const orders: Order[] = [
  {
    id: 1024,
    customerId: 1,
    state: "Validado",
    date: "2026-05-14",
    requestedDate: "2026-05-15",
    details: [
      { productId: 1, quantity: 36 },
      { productId: 2, quantity: 48 },
      { productId: 3, quantity: 18 },
    ],
    history: [
      {
        date: "2026-05-14 10:20",
        user: "josefa",
        field: "estado",
        previousValue: "Registrado",
        newValue: "Validado",
      },
    ],
  },
  {
    id: 1025,
    customerId: 2,
    state: "En produccion",
    date: "2026-05-14",
    requestedDate: "2026-05-15",
    details: [
      { productId: 2, quantity: 96 },
      { productId: 4, quantity: 42 },
    ],
    history: [
      {
        date: "2026-05-14 12:05",
        user: "produccion",
        field: "estado",
        previousValue: "Validado",
        newValue: "En produccion",
      },
    ],
  },
  {
    id: 1026,
    customerId: 3,
    state: "Listo para despacho",
    date: "2026-05-13",
    requestedDate: "2026-05-14",
    details: [
      { productId: 1, quantity: 24 },
      { productId: 3, quantity: 12 },
    ],
    history: [
      {
        date: "2026-05-14 08:40",
        user: "produccion",
        field: "estado",
        previousValue: "En produccion",
        newValue: "Listo para despacho",
      },
    ],
  },
]

export const invoices: Invoice[] = [
  { id: 5001, orderId: 1022, userId: 1, date: "2026-05-13", total: 67000, paymentMethod: "Transferencia" },
  { id: 5002, orderId: 1023, userId: 2, date: "2026-05-13", total: 45800, paymentMethod: "Efectivo" },
  { id: 5003, orderId: 1026, userId: 2, date: "2026-05-14", total: 86200, paymentMethod: "Transferencia" },
]

export const movements: StockMovement[] = [
  { id: 1, productId: 1, userId: 3, movementType: "ENTRADA", quantity: 120, date: "2026-05-14 09:10", description: "Produccion diaria" },
  { id: 2, productId: 2, userId: 3, movementType: "SALIDA", quantity: 96, date: "2026-05-14 12:00", description: "Reserva pedido #1025" },
  { id: 3, productId: 4, userId: 3, movementType: "MERMA", quantity: 3, date: "2026-05-13 17:35", description: "Envases danados" },
  { id: 4, productId: 3, userId: 1, movementType: "AJUSTE", quantity: 8, date: "2026-05-12 16:15", description: "Cuadratura semanal" },
]

export const forecasts: Forecast[] = [
  { productId: 2, expectedSales: 310, suggestedProduction: 260, confidence: 88, risk: "Alto" },
  { productId: 4, expectedSales: 145, suggestedProduction: 120, confidence: 81, risk: "Alto" },
  { productId: 1, expectedSales: 220, suggestedProduction: 80, confidence: 84, risk: "Medio" },
  { productId: 3, expectedSales: 96, suggestedProduction: 40, confidence: 76, risk: "Bajo" },
]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    currency: "CLP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

export function getProduct(productId: number) {
  return products.find((product) => product.id === productId)
}

export function getCustomer(customerId: number) {
  return customers.find((customer) => customer.id === customerId)
}

export function getPackagedStock(productId: number) {
  return packagedStock.find((stock) => stock.productId === productId)
}

export function getOrderTotal(order: Order) {
  return order.details.reduce((total, detail) => {
    const product = getProduct(detail.productId)
    return total + (product?.price ?? 0) * detail.quantity
  }, 0)
}

export function getMissingUnits(productId: number, requested: number) {
  const stock = getPackagedStock(productId)
  const available = stock?.availableStock ?? 0
  return Math.max(requested - available, 0)
}

export function getCriticalStocks() {
  return packagedStock.filter((stock) => stock.availableStock <= stock.minimumStock)
}
