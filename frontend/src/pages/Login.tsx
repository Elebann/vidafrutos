import { LoginForm } from "@/components/login-form.tsx"

export default function Login(){
  return (
    <div className="bg-[#FFF8F5] flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}