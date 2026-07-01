import { ShieldCheck } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { userSchema, type UserFormData } from "@/schemas/userSchema"
import apiClients from "@/lib/apiClients"
import type { Role, User } from "@/types/domain"
import type { ApiProduct } from "@/lib/apiTypes"
import { cn } from "@/lib/utils"

export function AdminUsersPage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [minimumStockValue, setMinimumStockValue] = useState<string>("")
  const [isSubmittingMinimumStock, setIsSubmittingMinimumStock] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    // @ts-expect-error Zod v4 type inference issue with @hookform/resolvers
    resolver: zodResolver(userSchema),
    defaultValues: {
      rut: "",
      username: "",
      password: "",
      rol: "",
    },
    mode: "onBlur",
  })

  const selectedProduct = products.find(
    (product) => String(product.id) === (selectedProductId || String(products[0]?.id ?? "")),
  )

  useEffect(() => {
    apiClients
      .fetchRoles()
      .then((loadedRoles) => {
        setRoles(loadedRoles)
        if (loadedRoles.length > 0 && !getValues("rol")) {
          setValue("rol", String(loadedRoles[0].id), { shouldValidate: false })
        }
      })
      .catch(() => {})
    apiClients.fetchUsers().then(setUsers).catch(() => {})
    apiClients
      .fetchBackendProducts()
      .then((loadedProducts) => {
        setProducts(loadedProducts)
        if (loadedProducts.length > 0) {
          setSelectedProductId(String(loadedProducts[0].id))
          const first = loadedProducts[0]
          if (first.packaged_stock?.minimum_stock !== undefined) {
            setMinimumStockValue(String(first.packaged_stock.minimum_stock))
          }
        }
      })
      .catch(() => {})
  }, [setValue, getValues])

  function handleProductChange(productId: string) {
    setSelectedProductId(productId)
    const product = products.find((p) => String(p.id) === productId)
    if (product?.packaged_stock?.minimum_stock !== undefined) {
      setMinimumStockValue(String(product.packaged_stock.minimum_stock))
    } else {
      setMinimumStockValue("")
    }
  }

  const onSubmitUser = async (data: UserFormData) => {
    try {
      const created = await apiClients.createUser({
        rut: data.rut,
        username: data.username,
        password: data.password,
        rol: data.rol ? Number(data.rol) : undefined,
      })

      if (!created) {
        alert("Error creando usuario")
        return
      }

      const refreshedUsers = await apiClients.fetchUsers()
      setUsers(refreshedUsers)

      reset({
        rut: "",
        username: "",
        password: "",
        rol: roles[0] ? String(roles[0].id) : "",
      })
      alert("Usuario creado")
    } catch (error) {
      console.error(error)
      alert("Error creando usuario")
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
          onSubmit={handleSubmit(onSubmitUser)}
          submitDisabled={isSubmitting}
        >
          <FieldGroup>
            <Field data-invalid={!!errors.rut}>
              <FieldLabel htmlFor="rut">RUT</FieldLabel>
              <Input
                id="rut"
                type="text"
                placeholder="Sin puntos, con guión. (Ej. 12345678-9)"
                {...register("rut")}
                aria-invalid={errors.rut ? "true" : "false"}
                className={cn(errors.rut && "border-red-500")}
              />
              {errors.rut && (
                <FieldError errors={[{ message: errors.rut.message }]} />
              )}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">Usuario</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="Solo letras y espacios"
                maxLength={50}
                {...register("username")}
                aria-invalid={errors.username ? "true" : "false"}
                className={cn(errors.username && "border-red-500")}
              />
              {errors.username && (
                <FieldError errors={[{ message: errors.username.message }]} />
              )}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="************"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                className={cn(errors.password && "border-red-500")}
              />
              {errors.password && (
                <FieldError errors={[{ message: errors.password.message }]} />
              )}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field data-invalid={!!errors.rol}>
              <FieldLabel>Rol</FieldLabel>
              <Controller
                control={control}
                name="rol"
                render={({ field }) => {
                  const roleName = roles.find(
                    (role) => String(role.id) === field.value,
                  )?.name
                  return (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        aria-invalid={errors.rol ? "true" : "false"}
                      >
                        <SelectValue placeholder="Seleccionar rol">
                          {roleName ?? null}
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
                  )
                }}
              />
              {errors.rol && (
                <FieldError errors={[{ message: errors.rol.message }]} />
              )}
            </Field>
          </FieldGroup>
        </FormCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {/*<FormCard submitLabel="Guardar rol" title="Rol">*/}
        {/*  <TextField label="Nombre rol" />*/}
        {/*  <TextField label="Permisos" placeholder="Pedidos, Inventario" />*/}
        {/*</FormCard>*/}
        {/*<FormCard submitLabel="Guardar estado" title="Estado de pedido">*/}
        {/*  <TextField label="Nombre estado" />*/}
        {/*</FormCard>*/}
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
                value={selectedProductId}
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
