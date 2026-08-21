import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Painel conceitual — só em telas grandes; no mobile a identidade fica reduzida ao ícone acima do formulário. */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[55%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-education/40 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-attendance/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold text-white">SME Baraúna</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-white xl:text-4xl">
            Educação que se transforma em informação.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Portal Educacional Integrado da Secretaria Municipal de Educação de Baraúna — RN.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/60">Secretaria Municipal de Educação de Baraúna — RN</p>
      </div>

      {/* Painel do formulário */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="h-8 w-8" />
            </span>
            <h1 className="text-xl font-semibold text-foreground">Portal Educacional Integrado</h1>
            <p className="text-sm text-foreground-muted">Secretaria Municipal de Educação de Baraúna - RN</p>
          </div>

          <Card className="p-6 sm:p-8">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Acesse sua conta</h2>
            <p className="mb-6 text-sm text-foreground-muted">
              Servidores, professores, alunos e responsáveis usam o mesmo acesso.
            </p>
            <LoginForm />
          </Card>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            <Link href="/" className="underline underline-offset-2 hover:text-foreground">
              Voltar ao site institucional
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
