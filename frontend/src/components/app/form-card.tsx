import type React from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionCard } from "@/components/app/page-shell"

export function FormCard({
  children,
  submitLabel = "Guardar",
  title,
  onSubmit,
  onCancel,
  submitDisabled,
}: {
  children: React.ReactNode
  submitLabel?: string
  title: string
  onSubmit?: (e: React.FormEvent) => void
  onCancel?: () => void
  submitDisabled?: boolean
}) {
  return (
    <SectionCard title={title}>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {children}
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="font-[family-name:var(--font-heading)]">
            Cancelar
          </Button>
          <Button type="submit" variant="VFBrown" disabled={submitDisabled} className="font-[family-name:var(--font-heading)]">
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
  onChange,
}: {
  label: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Input value={value} placeholder={placeholder} type={type} onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined} />
      </Field>
    </FieldGroup>
  )
}
