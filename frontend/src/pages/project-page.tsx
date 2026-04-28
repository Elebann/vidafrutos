import { Link, useParams } from "react-router-dom"

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function ProjectPage() {
  const { projectId } = useParams()
  const title = projectId ? toTitleCase(projectId) : "Proyecto"

  return (
    <div className="flex flex-1 p-6">
      <div className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Esta es una página de ejemplo dentro del router. El sidebar no se desmonta entre cambios de ruta.
          </p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Aquí puedes mostrar el detalle de cada proyecto, paneles o métricas específicas.
        </p>
        <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

