import * as React from "react"

export interface OVCardProps {
  icon: React.ReactNode
  title: string
  highlighted?: string
  className?: string
  children?: React.ReactNode
}

export function OVCard({ icon, title, highlighted, className = "", children }: OVCardProps) {
  return (
    <div
      className={`rounded-lg border border-[#643800]/30 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center gap-3 *:text-[#643800]">
        <span aria-hidden="true">{icon}</span>
        <h3 className="text-md leading-none font-bold">{title}</h3>
      </div>

      <div className={"mb-2"}>
        <span className={"text-xl font-bold text-[#643800]"}>
          {highlighted}
        </span>
      </div>

      {children && (
        <div className="text-sm text-muted-foreground">{children}</div>
      )}
    </div>
  )
}