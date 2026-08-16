import { GraduationCap, LogOut } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";
import type { SessionPayload } from "@/lib/auth";

const ROLE_LABEL: Record<SessionPayload["role"], string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria",
  DIRETOR: "Direção Escolar",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor(a)",
  ALUNO: "Aluno / Responsável",
};

export function PortalTopbar({ session, subtitle }: { session: SessionPayload; subtitle: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">{subtitle}</div>
          <div className="text-xs text-slate-500">{ROLE_LABEL[session.role]}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium text-slate-900">{session.nome}</div>
          <div className="text-xs text-slate-500">{session.cpf}</div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
