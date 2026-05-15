import type React from "react"

import { cn } from "@/lib/utils"

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
  red: "border-red-200 bg-red-50 text-red-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
}

export type BadgeTone = keyof typeof toneClasses

export function StatusBadge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode
  className?: string
  tone?: BadgeTone
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
