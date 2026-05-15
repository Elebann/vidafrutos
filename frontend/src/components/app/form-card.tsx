import type React from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionCard } from "@/components/app/page-shell"

export function FormCard({
  children,
  submitLabel = "Guardar",
  title,
}: {
  children: React.ReactNode
  submitLabel?: string
  title: string
}) {
  return (
    <SectionCard title={title}>
      <form className="grid gap-4 sm:grid-cols-2">
        {children}
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="button" variant="VFBrown">
            {submitLabel}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

export function TextField({
  label,
  placeholder,
  type = "text",
  value,
}: {
  label: string
  placeholder?: string
  type?: string
  value?: string
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Input defaultValue={value} placeholder={placeholder} type={type} />
      </Field>
    </FieldGroup>
  )
}
