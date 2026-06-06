import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type React from "react"

export type SortDir = "asc" | "desc"

export type SortableColumn<T> = {
  key: keyof T & string
  label: string
  sortable?: boolean
}

export function SortableResponsiveList<T>({
  columns,
  items,
  keyExtractor,
  renderCard,
  renderRow,
  sortBy,
  sortDir,
  onSort,
}: {
  columns: SortableColumn<T>[]
  items: T[]
  keyExtractor: (item: T) => string | number
  renderCard: (item: T) => React.ReactNode
  renderRow: (item: T) => React.ReactNode
  sortBy: string | null
  sortDir: SortDir
  onSort: (key: string) => void
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
              {columns.map((column) => {
                if (!column.sortable) {
                  return (
                    <th className="px-4 py-3" key={column.key}>
                      {column.label}
                    </th>
                  )
                }

                const isActive = sortBy === column.key
                const Icon = !isActive
                  ? ArrowUpDown
                  : sortDir === "asc"
                    ? ArrowUp
                    : ArrowDown

                return (
                  <th className="px-4 py-3" key={column.key}>
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium tracking-wide text-neutral-500 uppercase transition-colors hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {column.label}
                      <Icon className="size-3.5" />
                    </button>
                  </th>
                )
              })}
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
