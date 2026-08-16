import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, GraduationCap, LayoutDashboard, Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PortalTopbar } from "@/components/portal/topbar";

const NAV = [
  { href: "/portal/direcao", label: "Início", icon: LayoutDashboard },
  { href: "/portal/direcao/servidores", label: "Servidores", icon: Users },
  { href: "/portal/direcao/estudantes", label: "Estudantes", icon: GraduationCap },
  { href: "/portal/direcao/avaliacoes", label: "Avaliações Municipais", icon: ClipboardList },
];

export default async function DirecaoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["DIRETOR"]);
  if (!session.escolaId) notFound();

  const escola = await prisma.escola.findUnique({ where: { id: session.escolaId } });
  if (!escola) notFound();

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
        <PortalTopbar session={session} subtitle={escola.nome} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
