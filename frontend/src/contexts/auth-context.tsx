import { useState, useCallback, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { AuthContext, type UserInfo } from "@/contexts/auth-context-value"

function restoreStoredUser(): UserInfo | null {
  const token = localStorage.getItem("access_token")
  const storedUser = localStorage.getItem("user")

  if (!token || !storedUser) return null

  try {
    return JSON.parse(storedUser) as UserInfo
  } catch (error) {
    console.error("Error al restaurar sesión:", error)
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => restoreStoredUser())
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const isAuthenticated = user !== null

  const login = useCallback(async (rut: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.post("/api/auth/login/", {
        rut: rut,
        password: password,
      })

      const { access, refresh, user: userData } = response.data

      // Guardar tokens
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)

      // Guardar datos del usuario
      const userInfo: UserInfo = {
        username: userData?.username || rut,
        rut: userData?.rut || rut,
        rol: userData?.rol,
        rol_name: userData?.rol_name
      }
      localStorage.setItem("user", JSON.stringify(userInfo))

      setUser(userInfo)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido en inicio de sesión"
      console.error("Error en login:", errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      setUser(null)
      navigate("/login")
    } catch (error) {
      console.error("Error en logout:", error)
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}


