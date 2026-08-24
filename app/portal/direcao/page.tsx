import { BookOpen, CalendarCheck, ClipboardList, GraduationCap, Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard, type MetricCardAccent } from "@/components/ui/metric-card";

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

  const cards: { href: string; label: string; value: number; icon: typeof Users; accent: MetricCardAccent }[] = [
    { href: "/portal/direcao/servidores", label: "Servidores", value: totalServidores, icon: Users, accent: "primary" },
    {
      href: "/portal/direcao/estudantes",
      label: "Estudantes",
      value: totalEstudantes,
      icon: GraduationCap,
      accent: "success",
    },
    {
      href: "/portal/direcao/notas",
      label: `Notas lançadas (${anoAtual})`,
      value: totalNotas,
      icon: BookOpen,
      accent: "education",
    },
    {
      href: "/portal/direcao/frequencia",
      label: "Registros de frequência",
      value: totalFrequencias,
      icon: CalendarCheck,
      accent: "attendance",
    },
    {
      href: "/portal/direcao/avaliacoes",
      label: "Resultados de Avaliações",
      value: totalResultadosAvaliacao,
      icon: ClipboardList,
      accent: "info",
    },
  ];

  return (
    <div>
      <PageHeader title="Painel da Direção" description="Visão geral da unidade escolar." />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <MetricCard
            key={card.href}
            href={card.href}
            label={card.label}
            value={String(card.value)}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </div>
    </div>
  );
}
