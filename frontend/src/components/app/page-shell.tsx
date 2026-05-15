import type { LucideIcon } from "lucide-react"
import type React from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PageShell({
  action,
  children,
  description,
  icon: Icon,
  title,
}: {
  action?: {
    icon?: LucideIcon
    label: string
    to: string
  }
  children: React.ReactNode
  description?: string
  icon?: LucideIcon
  title: string
}) {
  const ActionIcon = action?.icon

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-[#fff8f3] px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#804f17]/20 bg-white text-[#804f17]">
                <Icon className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-neutral-950">{title}</h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm leading-5 text-neutral-600">{description}</p>
              )}
            </div>
          </div>

          {action && (
            <Button className="h-10 w-full sm:w-auto" variant="VFBrown" render={<Link to={action.to} />}>
              {ActionIcon && <ActionIcon />}
              {action.label}
            </Button>
          )}
        </header>

        {children}
      </div>
    </main>
  )
}

export function SectionCard({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode
  className?: string
  description?: string
  title?: string
}) {
  return (
    <section className={cn("rounded-lg border border-[#643800]/20 bg-white p-4", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-base font-semibold text-neutral-950">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
