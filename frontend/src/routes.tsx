import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/layouts/app-layout"
import { AdminUsersPage } from "@/pages/admin"
import { AuditPage } from "@/pages/audit"
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage"
import { CustomerFormPage } from "@/pages/customers/CustomerFormPage"
import { CustomersPage } from "@/pages/customers"
import { DashboardPage } from "@/pages/dashboard"
import { DispatchPage } from "@/pages/dispatch"
import { ForecastPage } from "@/pages/forecast"
import { InventoryPage } from "@/pages/inventory"
import { InventoryUpdatePage } from "@/pages/inventory/InventoryUpdatePage"
import { InvoiceFormPage } from "@/pages/invoices/InvoiceFormPage"
import { InvoicesPage } from "@/pages/invoices"
import { NewOrderPage } from "@/pages/orders/NewOrderPage"
import { NotFoundPage } from "@/pages/not-found-page"
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage"
import { OrdersPage } from "@/pages/orders"
import { ProductFormPage } from "@/pages/products/ProductFormPage"
import { ProductsPage } from "@/pages/products"
import { ProductionFormPage } from "@/pages/production/ProductionFormPage"
import { ProductionPage } from "@/pages/production"
import { ProtectedRoute } from "@/components/protected-route"
import { ReportsPage } from "@/pages/reports"
import Login from "@/pages/Login"
import { DeliveredOrders } from "@/pages/dispatch/DeliveredOrders.tsx"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="index" element={<Navigate to="/" replace />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/nuevo" element={<NewOrderPage />} />
        <Route path="pedidos/:orderId" element={<OrderDetailPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="clientes/nuevo" element={<CustomerFormPage />} />
        <Route path="clientes/:customerId" element={<CustomerDetailPage />} />
        <Route path="productos" element={<ProductsPage />} />
        <Route path="productos/nuevo" element={<ProductFormPage />} />
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="inventario/actualizar" element={<InventoryUpdatePage />} />
        <Route path="produccion" element={<ProductionPage />} />
        <Route path="produccion/registrar" element={<ProductionFormPage />} />
        <Route path="despacho" element={<DispatchPage />} />
        <Route path="enviados" element={<DeliveredOrders />} />
        <Route path="facturas" element={<InvoicesPage />} />
        <Route path="facturas/generar" element={<InvoiceFormPage />} />
        <Route path="prediccion" element={<ForecastPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="admin/usuarios" element={<AdminUsersPage />} />
        <Route path="auditoria" element={<AuditPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
