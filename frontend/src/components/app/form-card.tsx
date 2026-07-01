import type React from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SectionCard } from "@/components/app/page-shell"
import { cn } from "@/lib/utils"

export function FormCard({
  children,
  submitLabel = "Guardar",
  title,
  description,
  onSubmit,
  onCancel,
  submitDisabled,
}: {
  children: React.ReactNode
  submitLabel?: string
  title: string
  description?: string
  onSubmit?: (e: React.FormEvent) => void
  onCancel?: () => void
  submitDisabled?: boolean
}) {
  return (
    <SectionCard title={title} description={description}>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {children}
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="font-heading">
            Cancelar
          </Button>
          <Button type="submit" variant="VFBrown" disabled={submitDisabled} className="font-heading">
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
  error,
  maxLength,
}: {
  label: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  maxLength?: number
}) {
  return (
    <FieldGroup>
      <Field data-invalid={!!error}>
        <FieldLabel>{label}</FieldLabel>
        <Input
          aria-invalid={error ? "true" : "false"}
          className={cn(error && "border-red-500")}
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          type={type}
          onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
        />
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>
    </FieldGroup>
  )
}
