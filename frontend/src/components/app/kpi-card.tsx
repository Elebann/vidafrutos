import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const toneClasses = {
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-neutral-200 bg-white text-neutral-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
}

export function KpiCard({
  detail,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  detail: string
  icon: LucideIcon
  label: string
  tone?: keyof typeof toneClasses
  value: string
}) {
  return (
    <article className={cn("rounded-lg border p-4 shadow-sm", toneClasses[tone])}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Icon className="size-5 shrink-0" />
      </div>
      <strong className="block text-2xl font-semibold leading-none text-neutral-950">{value}</strong>
      <p className="mt-2 text-sm leading-5 text-neutral-600">{detail}</p>
    </article>
  )
}
