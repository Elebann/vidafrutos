import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La ruta solicitada no existe. Puedes volver al inicio para seguir navegando.
        </p>
        <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

