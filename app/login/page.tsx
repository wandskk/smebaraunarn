import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold">Portal Educacional Integrado</h1>
          <p className="text-sm text-brand-100">Secretaria Municipal de Educação de Baraúna - RN</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Acesse sua conta</h2>
          <p className="mb-6 text-sm text-slate-500">
            Servidores, professores, alunos e responsáveis usam o mesmo acesso.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-brand-100">
          <Link href="/" className="underline underline-offset-2 hover:text-white">
            Voltar ao site institucional
          </Link>
        </p>
      </div>
    </main>
  );
}
