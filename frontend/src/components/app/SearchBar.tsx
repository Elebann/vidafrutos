import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
}

export function SearchBar({ placeholder = "Buscar", value, onChange, error }: SearchBarProps) {
  return (
    <div className="grid gap-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-invalid={error ? "true" : "false"}
          className={cn("h-10 bg-white pl-9", error && "border-red-500")}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      {error && <FieldError errors={[{ message: error }]} />}
    </div>
  )
}
