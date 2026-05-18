import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { KeyRound, Leaf, UserLock } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type LoginFormData, loginSchema } from "@/schemas/loginSchema"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    // @ts-expect-error Zod v4 type inference issue with @hookform/resolvers
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage("")
    try {
      await login(data.rut, data.password)
      navigate("/")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error en inicio de sesión"
      setErrorMessage(message)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-row items-center mx-auto gap-2 text-center *:text-[#643800]">
            <div className="flex size-8 items-center justify-center rounded-md">
              <Leaf className="size-6" />
            </div>
            <h1 className="text-2xl font-bold">VidaFrutos</h1>
          </div>

          <div>
            <h2 className="text-md font-semibold text-neutral-600">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tu RUT y contraseña para acceder a tu cuenta.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="rut"><UserLock size={16} />RUT</FieldLabel>
            <Input
              id="rut"
              type="text"
              placeholder={"Sin puntos, con guión. (Ej. 12345678-9)"}
              {...register("rut")}
              className={cn(errors.rut && "border-red-500")}
              aria-invalid={errors.rut ? "true" : "false"}
            />
            {errors.rut && (
              <p className="text-sm text-red-500 mt-1">{errors.rut.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="password"><KeyRound size={16}/>Contraseña</FieldLabel>

            <Input
              id="password"
              type="password"
              placeholder="************"
              {...register("password")}
              className={cn(errors.password && "border-red-500")}
              aria-invalid={errors.password ? "true" : "false"}
            />

            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </Field>

          <Field>
            <Button
              type="submit"
              variant={"VFBrown"}
              disabled={isAuthLoading}
              className="w-full"
            >
              {isAuthLoading ? "Accediendo..." : "Acceder"}
            </Button>
          </Field>

          {errorMessage && (
            <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

        </FieldGroup>
      </form>
    </div>
  )
}
