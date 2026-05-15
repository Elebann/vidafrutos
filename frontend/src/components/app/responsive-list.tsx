import type React from "react"

import { cn } from "@/lib/utils"

export function ResponsiveList<T>({
  columns,
  items,
  keyExtractor,
  renderCard,
  renderRow,
}: {
  columns: string[]
  items: T[]
  keyExtractor: (item: T) => string | number
  renderCard: (item: T) => React.ReactNode
  renderRow: (item: T) => React.ReactNode
}) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <div key={keyExtractor(item)}>{renderCard(item)}</div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr className="align-top" key={keyExtractor(item)}>
                {renderRow(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <article
      className={cn("rounded-lg border bg-white p-4 shadow-sm", className)}
    >
      {children}
    </article>
  )
}
