import { ShieldCheck } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Role, User } from "@/types/domain"
import type { ApiProduct } from "@/lib/apiTypes"

export function AdminUsersPage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [rut, setRut] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [minimumStockValue, setMinimumStockValue] = useState<string>("")
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [isSubmittingMinimumStock, setIsSubmittingMinimumStock] = useState(false)

  const selectedRole = roles.find((role) => String(role.id) === selectedRoleId)
  const defaultProductId = products[0] ? String(products[0].id) : ""
  const effectiveProductId = selectedProductId || defaultProductId
  const selectedProduct = products.find((product) => String(product.id) === effectiveProductId)

  useEffect(() => {
    apiClients
      .fetchRoles()
      .then((loadedRoles) => {
        setRoles(loadedRoles)
        if (loadedRoles.length > 0) {
          setSelectedRoleId(String(loadedRoles[0].id))
        }
      })
      .catch(() => {})
    apiClients.fetchUsers().then(setUsers).catch(() => {})
    apiClients
      .fetchBackendProducts()
      .then((loadedProducts) => {
        setProducts(loadedProducts)
        if (loadedProducts.length > 0) {
          const first = loadedProducts[0]
          if (first.packaged_stock?.minimum_stock !== undefined) {
            setMinimumStockValue(String(first.packaged_stock.minimum_stock))
          }
        }
      })
      .catch(() => {})
  }, [])

  function handleProductChange(productId: string) {
    setSelectedProductId(productId)
    const product = products.find((p) => String(p.id) === productId)
    if (product?.packaged_stock?.minimum_stock !== undefined) {
      setMinimumStockValue(String(product.packaged_stock.minimum_stock))
    } else {
      setMinimumStockValue("")
    }
  }

  async function handleNewUser(e: React.FormEvent) {
    e.preventDefault()

    if (isSubmittingUser) return

    const trimmedRut = rut.trim()
    const trimmedUsername = username.trim()

    if (!trimmedRut || !trimmedUsername || password.length < 8) {
      alert("RUT, usuario y contraseña son requeridos (la contraseña debe tener al menos 8 caracteres)")
      return
    }

    if (/\s/.test(trimmedUsername)) {
      alert("El usuario no puede contener espacios")
      return
    }

    if (roles.length > 0 && !selectedRoleId) {
      alert("Debes seleccionar un rol")
      return
    }

    setIsSubmittingUser(true)
    try {
      const created = await apiClients.createUser({
        rut: trimmedRut,
        username: trimmedUsername,
        password,
        rol: selectedRoleId ? Number(selectedRoleId) : undefined,
      })

      if (!created) {
        alert("Error creando usuario")
        return
      }

      const refreshedUsers = await apiClients.fetchUsers()
      setUsers(refreshedUsers)

      setRut("")
      setUsername("")
      setPassword("")
      alert("Usuario creado")
    } catch (error) {
      console.error(error)
      alert("Error creando usuario")
    } finally {
      setIsSubmittingUser(false)
    }
  }

  async function handleUpdateMinimumStock(e: React.FormEvent) {
    e.preventDefault()

    if (isSubmittingMinimumStock) return
    if (!selectedProduct) {
      alert("Selecciona un producto")
      return
    }

    const parsedMinimum = Number(minimumStockValue)
    if (!Number.isFinite(parsedMinimum) || parsedMinimum < 0) {
      alert("Ingresa un umbral mínimo válido (>= 0)")
      return
    }

    const productId = selectedProduct.id
    const previousMinimum = selectedProduct.packaged_stock?.minimum_stock ?? 0

    setIsSubmittingMinimumStock(true)
    try {
      await apiClients.updateProductMinimumStock(productId, parsedMinimum)

      setProducts((prev) =>
        prev.map((product) =>
          String(product.id) === String(productId)
            ? {
                ...product,
                packaged_stock: {
                  ...(product.packaged_stock ?? {}),
                  minimum_stock: parsedMinimum,
                },
              }
            : product
        )
      )

      alert("Alerta de stock actualizada")
    } catch (error) {
      console.error(error)
      alert("Error actualizando alerta de stock")
      setMinimumStockValue(String(previousMinimum))
    } finally {
      setIsSubmittingMinimumStock(false)
    }
  }

  return (
    <PageShell
      description="Usuarios, roles, estados y alertas base del sistema."
      icon={ShieldCheck}
      title="Administración"
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Usuarios">
          <div className="grid gap-2">
            {users.map((user) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md border bg-neutral-50 px-3 py-2"
                key={user.id}
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.rut}</p>
                </div>
                <StatusBadge tone={user.active ? "green" : "neutral"}>
                  {roles.find((role) => role.id === user.roleId)?.name}
                </StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
        <FormCard
          submitLabel="Guardar usuario"
          title="Nuevo usuario"
          onSubmit={handleNewUser}
          submitDisabled={isSubmittingUser}
        >
          <TextField label="Rut" value={rut} onChange={setRut} />
          <TextField
            label="Usuario"
            value={username}
            onChange={(value) => setUsername(value.replace(/\s/g, ""))}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <FieldGroup>
            <Field>
              <FieldLabel>Rol</FieldLabel>
              <Select
                value={selectedRoleId}
                onValueChange={(value) => setSelectedRoleId(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol">
                    {selectedRole ? selectedRole.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FormCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <FormCard submitLabel="Guardar rol" title="Rol">
          <TextField label="Nombre rol" />
          <TextField label="Permisos" placeholder="Pedidos, Inventario" />
        </FormCard>
        <FormCard submitLabel="Guardar estado" title="Estado de pedido">
          <TextField label="Nombre estado" />
        </FormCard>
        <FormCard
          submitLabel="Guardar alerta"
          title="Alerta de stock"
          onSubmit={handleUpdateMinimumStock}
          submitDisabled={isSubmittingMinimumStock}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select
                value={effectiveProductId}
                onValueChange={(value) => handleProductChange(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un producto">
                    {selectedProduct ? selectedProduct.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <TextField
            label="Umbral minimo"
            type="number"
            value={minimumStockValue}
            onChange={setMinimumStockValue}
          />
        </FormCard>
      </div>
    </PageShell>
  )
}
