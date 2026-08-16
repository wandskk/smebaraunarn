import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { PortalTopbar } from "@/components/portal/topbar";

const NAV = [
  { href: "/portal/professor", label: "Início", icon: LayoutDashboard },
  { href: "/portal/professor/turma", label: "Minha Turma", icon: Users },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) notFound();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <PortalTopbar session={session} subtitle={servidor.escolaNome ?? servidor.escola?.nome ?? "Escola"} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
