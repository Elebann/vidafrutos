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
    to?: string
    onClick?: () => void
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
              <Icon className="m-auto size-10 justify-center items-center text-[#804f17]" />
            )}
            <div className="min-w-0">
              <h1 className="text-[#804f17] text-2xl leading-tight font-bold">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm leading-5 text-neutral-600">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action && action.to && (
            <Button
              className="h-10 w-full sm:w-auto"
              variant="VFBrown"
              render={<Link to={action.to} />}
            >
              {ActionIcon && <ActionIcon />}
              {action.label}
            </Button>
          )}
          {action && action.onClick && !action.to && (
            <Button
              className="h-10 w-full sm:w-auto"
              variant="VFBrown"
              onClick={action.onClick}
            >
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
  action,
}: {
  children: React.ReactNode
  className?: string
  description?: string
  title?: string
  action?: {
    icon?: LucideIcon
    label: string
    to?: string
    onClick?: () => void
  }
}) {
  const ActionIcon = action?.icon

  return (
    <section
      className={cn(
        "rounded-lg border border-[#643800]/20 bg-white p-4",
        className
      )}
    >
      {(title || description) && (
        <div className="flex justify-between mb-4">
          {title && (
            <h2 className="text-base font-semibold text-neutral-950">
              {title}
            </h2>
          )}
          {action && action.to && (
            <Button
              className="h-10 w-full sm:w-auto"
              render={<Link to={action.to} />}
            >
              {ActionIcon && <ActionIcon />}
              {action.label}
            </Button>
          )}
          {action && action.onClick && !action.to && (
            <Button
              className="h-10 w-full sm:w-auto"
              onClick={action.onClick}
            >
              {ActionIcon && <ActionIcon />}
              {action.label}
            </Button>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
