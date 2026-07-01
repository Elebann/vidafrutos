import { useAuth } from "@/hooks/use-auth"
import { canAccessPath, getDefaultPathForRole } from "@/lib/permissions"
import { Navigate, useLocation } from "react-router-dom"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const defaultPath = getDefaultPathForRole(user)

  if (location.pathname === "/" && defaultPath !== "/") {
    return <Navigate to={defaultPath} replace />
  }

  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to={defaultPath} replace />
  }

  return <>{children}</>
}

