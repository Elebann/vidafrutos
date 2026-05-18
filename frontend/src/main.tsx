import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import "./index.css"
import App from "@/App.tsx"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AppLayout } from "@/layouts/app-layout"
import {
  AdminUsersPage,
  AuditPage,
  CustomerDetailPage,
  CustomerFormPage,
  CustomersPage,
  DispatchPage,
  ForecastPage,
  InventoryPage,
  InventoryUpdatePage,
  InvoiceFormPage,
  InvoicesPage,
  NewOrderPage,
  OrderDetailPage,
  OrdersPage,
  ProductFormPage,
  ProductsPage,
  ProductionFormPage,
  ProductionPage,
  ReportsPage,
} from "@/pages/app-pages"
import Login from "@/pages/Login"
import { NotFoundPage } from "@/pages/not-found-page"

function AppRoutes() {
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
        <Route index element={<App />} />
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
