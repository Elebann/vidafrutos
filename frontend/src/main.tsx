import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import "./index.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/layouts/app-layout"

import Login from "@/pages/Login"
import Test from "@/pages/Test"
import AgregarCliente from "@/pages/AgregarCliente"
import { SectionPage } from "@/pages/section-page"
import { NotFoundPage } from "@/pages/not-found-page"
import App from "@/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Sin sidebar */}
          <Route path="/login" element={<Login />} />

          {/* Con sidebar */}
          <Route element={<AppLayout />}>
            <Route index element={<App />} />
            <Route path="index" element={<Navigate to="/" replace />} />
            <Route path="add-product" element={<Test />} />
            <Route path="holamundo" element={<AgregarCliente />} />
            <Route path="section/:sectionId" element={<SectionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
