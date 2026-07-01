import type { UserInfo } from "@/contexts/auth-context-value"

export type RoleName = "Administrador" | "Operario" | "Despacho" | "Ventas"

export const ROLE_IDS: Record<RoleName, number> = {
  Administrador: 1,
  Operario: 2,
  Despacho: 3,
  Ventas: 4,
}

const ADMIN_ROUTES = [
  "/",
  "/pedidos",
  "/pedidos/nuevo",
  "/pedidos/:orderId",
  "/clientes",
  "/clientes/nuevo",
  "/clientes/:customerId",
  "/productos",
  "/productos/nuevo",
  "/inventario",
  "/inventario/actualizar",
  "/produccion",
  "/produccion/registrar",
  "/despacho",
  "/despacho/:orderId",
  "/enviados",
  "/pagos",
  "/prediccion",
  "/reportes",
  "/admin/usuarios",
  "/auditoria",
]

const ROLE_ROUTES: Record<RoleName, string[]> = {
  Administrador: ADMIN_ROUTES,
  Operario: [
    "/inventario",
    "/inventario/actualizar",
    "/produccion",
    "/produccion/registrar",
    "/despacho",
    "/despacho/:orderId",
  ],
  Despacho: [
    "/pedidos",
    "/pedidos/nuevo",
    "/pedidos/:orderId",
    "/clientes",
    "/clientes/nuevo",
    "/clientes/:customerId",
    "/despacho",
    "/despacho/:orderId",
    "/enviados",
    "/pagos",
  ],
  Ventas: [
    "/pedidos",
    "/pedidos/:orderId",
    "/clientes",
    "/clientes/nuevo",
    "/clientes/:customerId",
    "/pagos",
    "/reportes",
  ],
}

const DEFAULT_PATH_BY_ROLE: Record<RoleName, string> = {
  Administrador: "/",
  Operario: "/inventario",
  Despacho: "/pedidos",
  Ventas: "/pedidos",
}

export function getUserRole(user: UserInfo | null | undefined): RoleName | null {
  if (!user) return null

  if (user.rol_name && user.rol_name in ROLE_IDS) {
    return user.rol_name as RoleName
  }

  const entry = Object.entries(ROLE_IDS).find(([, id]) => id === user.rol)
  return entry ? (entry[0] as RoleName) : null
}

export function hasRole(user: UserInfo | null | undefined, role: RoleName) {
  return getUserRole(user) === role
}

export function getDefaultPathForRole(user: UserInfo | null | undefined) {
  const role = getUserRole(user)
  return role ? DEFAULT_PATH_BY_ROLE[role] : "/login"
}

export function canAccessPath(user: UserInfo | null | undefined, pathname: string) {
  const role = getUserRole(user)
  if (!role) return false

  if (role === "Administrador") return true

  const normalizedPath = normalizePath(pathname)
  return ROLE_ROUTES[role].some((route) => matchesRoute(route, normalizedPath))
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/index") return "/"
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
}

function matchesRoute(route: string, pathname: string) {
  const routeParts = route.split("/").filter(Boolean)
  const pathParts = pathname.split("/").filter(Boolean)

  if (routeParts.length !== pathParts.length) return false

  return routeParts.every((part, index) => {
    if (part.startsWith(":")) return pathParts[index]?.length > 0
    return part === pathParts[index]
  })
}
