import Link from "next/link";
import { CheckCircle2, ClipboardList, FileText, GraduationCap, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStatusSincronizacao, ROTULO_MODULO } from "@/lib/queries/qualidade-dados";
import { getInsightsAtencao } from "@/lib/queries/atencao";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { InsightCard } from "@/components/ui/insight-card";
import { EmptyState } from "@/components/ui/empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { buttonVariants } from "@/components/ui/button";

function staggerStyle(index: number): React.CSSProperties {
  return { "--stagger-delay": `${index * 60}ms` } as React.CSSProperties;
}

export default async function AdminDashboardPage() {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anoLetivo = anosRows[0]?.ano ?? new Date().getFullYear();

  const [totalPosts, totalServidores, totalEstudantes, totalAvaliacoes, { modulos }, insights] = await Promise.all([
    prisma.post.count(),
    prisma.servidor.count(),
    prisma.estudante.count(),
    prisma.avaliacao.count(),
    getStatusSincronizacao(),
    getInsightsAtencao(anoLetivo),
  ]);

  const modulosComProblema = modulos.filter((m) => m.situacao !== "em-dia" || m.execucaoIncompleta);
  const modulosEmDiaPercentual = modulos.length > 0 ? ((modulos.length - modulosComProblema.length) / modulos.length) * 100 : null;

  const cards = [
    { label: "Publicações no CMS", value: totalPosts, href: "/admin/posts", icon: FileText, accent: "warning" as const },
    { label: "Servidores cadastrados", value: totalServidores, href: "/admin/servidores", icon: Users, accent: "success" as const },
    { label: "Estudantes enturmados", value: totalEstudantes, href: "/admin/estudantes", icon: GraduationCap, accent: "primary" as const },
    { label: "Avaliações municipais", value: totalAvaliacoes, href: "/admin/avaliacoes", icon: ClipboardList, accent: "education" as const },
  ];

  return (
    <div>
      <PageHeader title="Visão Geral" description="Resumo do portal e da base de dados sincronizada." />

      <h2 className="mt-8 text-sm font-semibold text-foreground">Atenção agora</h2>
      {insights.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={CheckCircle2}
          title="Nenhum ponto de atenção no momento"
          description="Nenhuma regra vigente disparou (frequência em queda, desempenho abaixo da rede, distorção elevada e sincronização atrasada)."
        />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <div key={insight.id} className="animate-fade-in-up" style={staggerStyle(index)}>
              <InsightCard insight={insight} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Números da rede</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div key={card.label} className="animate-fade-in-up" style={staggerStyle(index)}>
            <MetricCard
              label={card.label}
              value={<AnimatedNumber value={card.value} />}
              icon={card.icon}
              href={card.href}
              accent={card.accent}
            />
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <RingProgress
              value={modulosEmDiaPercentual}
              accent={modulosComProblema.length > 0 ? "warning" : "success"}
              size={56}
              strokeWidth={7}
            />
            <div>
              <div className="text-sm font-semibold text-foreground">Saúde da base</div>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {modulosComProblema.length === 0
                  ? "Todos os módulos sincronizados estão em dia."
                  : `${modulosComProblema.length} módulo(s) atrasado(s) ou sem sincronização — os indicadores que dependem deles podem estar desatualizados.`}
              </p>
            </div>
          </div>
          <Link href="/admin/sincronizacao" className={buttonVariants({ variant: "secondary" })}>
            Ir para Sincronização
          </Link>
        </div>

        <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {modulos.map((m) => (
            <div key={m.modulo} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-foreground-muted">
                {ROTULO_MODULO[m.modulo]}
                {m.execucaoIncompleta && <Badge variant="danger">Travado</Badge>}
              </span>
              <DataFreshnessBadge situacao={m.situacao} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
