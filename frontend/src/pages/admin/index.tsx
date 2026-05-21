import { ShieldCheck } from "lucide-react"

import { FormCard, TextField } from "@/components/app/form-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { StatusBadge } from "@/components/app/status-badge"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { products, roles, users } from "@/data/mock-data"

export function AdminUsersPage() {
  return (
    <PageShell description="Usuarios, roles, estados y alertas base del sistema." icon={ShieldCheck} title="Administracion">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Usuarios">
          <div className="grid gap-2">
            {users.map((user) => <div className="flex items-center justify-between gap-3 rounded-md border bg-neutral-50 px-3 py-2" key={user.id}><div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.rut}</p></div><StatusBadge tone={user.active ? "green" : "neutral"}>{roles.find((role) => role.id === user.roleId)?.name}</StatusBadge></div>)}
          </div>
        </SectionCard>
        <FormCard submitLabel="Guardar usuario" title="Nuevo usuario">
          <TextField label="RUT" />
          <TextField label="Username" />
          <FieldGroup>
            <Field>
              <FieldLabel>Rol</FieldLabel>
              <Select defaultValue={roles[0]?.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
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
        <FormCard submitLabel="Guardar alerta" title="Alerta de stock">
          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <Select defaultValue={products[0]?.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <TextField label="Umbral minimo" type="number" />
        </FormCard>
      </div>
    </PageShell>
  )
}
