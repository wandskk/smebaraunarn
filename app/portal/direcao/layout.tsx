import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  TriangleAlert,
  Users,
} from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PortalTopbar } from "@/components/portal/topbar";
import { logoutAction } from "@/app/logout/actions";

const NAV = [
  { href: "/portal/direcao", label: "Início", icon: LayoutDashboard },
  { href: "/portal/direcao/servidores", label: "Servidores", icon: Users },
  { href: "/portal/direcao/turmas", label: "Turmas", icon: LayoutGrid },
  { href: "/portal/direcao/estudantes", label: "Estudantes", icon: GraduationCap },
  { href: "/portal/direcao/notas", label: "Notas", icon: BookOpen },
  { href: "/portal/direcao/frequencia", label: "Frequência", icon: CalendarCheck },
  { href: "/portal/direcao/avaliacoes", label: "Avaliações Municipais", icon: ClipboardList },
];

export default async function DirecaoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["DIRETOR"]);

  if (!session.escolaId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-amber-600" />
          <h1 className="text-lg font-semibold text-slate-900">Conta ainda não vinculada a uma escola</h1>
          <p className="mt-2 text-sm text-slate-600">
            Seu cadastro de direção não está associado a nenhuma escola no SIGEduc — isso
            acontece porque, na fonte de dados, cargos de direção ficam vinculados à Secretaria,
            não a uma unidade escolar específica. Peça à Secretaria de Educação para vincular sua
            conta à escola correta em <strong>Usuários e Acessos</strong>.
          </p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

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
