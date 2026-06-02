import type React from "react"

import { cn } from "@/lib/utils"

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
  red: "border-red-200 bg-red-50 text-red-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700"
}

export type BadgeTone = keyof typeof toneClasses

export function StatusBadge({
  children,
  className,
  tone = "neutral",
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode
  className?: string
  tone?: BadgeTone
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  ariaLabel?: string
}) {
  const isInteractive = Boolean(onClick)
  const computedClassName = cn(
    "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
    toneClasses[tone],
    isInteractive &&
      "cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    className,
  )

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={computedClassName}
      >
        {children}
      </button>
    )
  }

  return <span className={computedClassName}>{children}</span>
}
