import Link from "next/link";
import { GraduationCap, LogOut, UserCog } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";
import type { SessionPayload } from "@/lib/auth";

export function AdminTopbar({ session }: { session: SessionPayload }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">Painel Administrativo</div>
          <div className="text-xs text-slate-500">SME Baraúna - RN</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-sm font-medium text-slate-900">{session.nome}</div>
          <div className="text-xs text-slate-500">{session.role}</div>
        </div>
        <Link
          href="/conta"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <UserCog className="h-4 w-4" />
          Minha Conta
        </Link>
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
