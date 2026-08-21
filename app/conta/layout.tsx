import Link from "next/link";
import { ArrowLeft, GraduationCap, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/session";
import { logoutAction } from "@/app/logout/actions";

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const homePath = session ? roleHomePath(session.role) : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
        <Link href={homePath} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">SME Baraúna</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted transition hover:bg-surface-muted"
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
