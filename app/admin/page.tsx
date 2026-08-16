import Link from "next/link";
import { ClipboardList, FileText, GraduationCap, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [totalPosts, totalServidores, totalEstudantes, totalAvaliacoes] = await Promise.all([
    prisma.post.count(),
    prisma.servidor.count(),
    prisma.estudante.count(),
    prisma.avaliacao.count(),
  ]);

  const cards = [
    { label: "Publicações no CMS", value: totalPosts, href: "/admin/posts", icon: FileText },
    { label: "Servidores cadastrados", value: totalServidores, href: "/admin/servidores", icon: Users },
    { label: "Estudantes enturmados", value: totalEstudantes, href: "/admin/estudantes", icon: GraduationCap },
    { label: "Avaliações municipais", value: totalAvaliacoes, href: "/admin/avaliacoes", icon: ClipboardList },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Visão Geral</h1>
      <p className="mt-1 text-sm text-slate-500">Resumo do portal e da base de dados sincronizada.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
          >
            <card.icon className="mb-3 h-5 w-5 text-brand-600" />
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-xs text-slate-500">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Utilize <Link href="/admin/sincronizacao" className="text-brand-700 underline">Sincronização SIGEduc</Link>{" "}
        para importar escolas, servidores e estudantes a partir da API Educ 21.
      </div>
    </div>
  );
}
