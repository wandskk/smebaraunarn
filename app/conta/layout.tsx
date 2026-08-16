import Link from "next/link";
import { ArrowLeft, GraduationCap, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/session";
import { logoutAction } from "@/app/logout/actions";

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const homePath = session ? roleHomePath(session.role) : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
        <Link href={homePath} className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-900">SME Baraúna</span>
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
      </header>
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
