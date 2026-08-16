import Link from "next/link";
import { BookOpen, CalendarCheck, ClipboardList, GraduationCap, Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function DirecaoHomePage() {
  const session = await requireSession(["DIRETOR"]);
  const escolaId = session.escolaId!;
  const anoAtual = new Date().getFullYear();

  const [totalServidores, totalEstudantes, totalResultadosAvaliacao, totalNotas, totalFrequencias] =
    await Promise.all([
      prisma.servidor.count({ where: { escolaId } }),
      prisma.estudante.count({ where: { escolaId } }),
      prisma.avaliacaoResultadoAluno.count({ where: { escolaId } }),
      prisma.notaEstudante.count({ where: { ano: anoAtual, estudante: { escolaId } } }),
      prisma.frequenciaEstudante.count({ where: { estudante: { escolaId } } }),
    ]);

  const cards = [
    { href: "/portal/direcao/servidores", label: "Servidores", value: totalServidores, icon: Users },
    { href: "/portal/direcao/estudantes", label: "Estudantes", value: totalEstudantes, icon: GraduationCap },
    { href: "/portal/direcao/notas", label: `Notas lançadas (${anoAtual})`, value: totalNotas, icon: BookOpen },
    {
      href: "/portal/direcao/frequencia",
      label: "Registros de frequência",
      value: totalFrequencias,
      icon: CalendarCheck,
    },
    {
      href: "/portal/direcao/avaliacoes",
      label: "Resultados de Avaliações",
      value: totalResultadosAvaliacao,
      icon: ClipboardList,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Painel da Direção</h1>
      <p className="mt-1 text-sm text-slate-500">Visão geral da unidade escolar.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
          >
            <card.icon className="mb-3 h-6 w-6 text-brand-600" />
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-xs text-slate-500">{card.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
