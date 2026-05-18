import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"

interface User {
  username: string
  rut?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (rut: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = user !== null

  // Restaurar sesión al cargar la app
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("user")

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error al restaurar sesión:", error)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

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
      const userInfo: User = {
        username: userData?.username || rut,
        rut: rut,
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



