import { CheckCircle2, ClipboardList, GraduationCap, Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { getInsightsAtencaoEscola } from "@/lib/queries/atencao";
import { getStatusSincronizacao, ROTULO_MODULO } from "@/lib/queries/qualidade-dados";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import { resolverAnoLetivo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard, type MetricCardAccent } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SchoolOverview } from "@/components/portal/school-overview";
import { InsightCard } from "@/components/ui/insight-card";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface PageProps {
  searchParams: { ano?: string };
}

export default async function DirecaoHomePage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const escolaId = session.escolaId!;

  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], where: { escolaId }, orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));

  const [{ escolas: comparativos }, insights, { modulos }, totalServidores, totalEstudantes, totalResultadosAvaliacao] =
    await Promise.all([
      getComparativosPorEscola({ anoLetivo, ...janela }),
      getInsightsAtencaoEscola(escolaId, anoLetivo),
      getStatusSincronizacao(),
      prisma.servidor.count({ where: { escolaId } }),
      prisma.estudante.count({ where: { escolaId } }),
      prisma.avaliacaoResultadoAluno.count({ where: { escolaId } }),
    ]);

  const comparativo = comparativos.find((c) => c.escolaId === escolaId) ?? null;
  const modulosComProblema = modulos.filter((m) => m.situacao !== "em-dia" || m.execucaoIncompleta);

  const cardsEstrutura: { href: string; label: string; value: number; icon: typeof Users; accent: MetricCardAccent }[] = [
    { href: "/portal/direcao/servidores", label: "Servidores", value: totalServidores, icon: Users, accent: "primary" },
    { href: "/portal/direcao/estudantes", label: "Estudantes", value: totalEstudantes, icon: GraduationCap, accent: "success" },
    {
      href: "/portal/direcao/avaliacoes",
      label: "Resultados de avaliações",
      value: totalResultadosAvaliacao,
      icon: ClipboardList,
      accent: "info",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Painel da Direção"
        description="Cockpit da unidade escolar — mesmos cálculos do Admin, escopados à sua escola."
        actions={
          anosDisponiveis.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <Select name="ano" defaultValue={anoLetivo}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    Ano letivo {ano}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Aplicar
              </Button>
            </form>
          )
        }
      />

      <h2 className="mt-8 text-sm font-semibold text-foreground">Atenção agora</h2>
      {insights.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={CheckCircle2}
          title="Nenhum ponto de atenção no momento"
          description="Nenhuma regra vigente disparou (frequência em queda, desempenho abaixo da rede e distorção elevada)."
        />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <div key={insight.id} className="animate-fade-in-up" style={{ "--stagger-delay": `${index * 60}ms` } as React.CSSProperties}>
              <InsightCard insight={insight} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Comparação com a rede — {anoLetivo}</h2>
      <div className="mt-3">
        <SchoolOverview comparativo={comparativo} anoLetivo={anoLetivo} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Estrutura da escola</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {cardsEstrutura.map((card, index) => (
          <div key={card.href} className="animate-fade-in-up" style={{ "--stagger-delay": `${index * 60}ms` } as React.CSSProperties}>
            <MetricCard
              href={card.href}
              label={card.label}
              value={<AnimatedNumber value={card.value} />}
              icon={card.icon}
              accent={card.accent}
            />
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Atualização dos dados</h2>
      <p className="mt-1 text-xs text-foreground-muted">
        Cada indicador acima usa a atualização do módulo do qual depende — um sync de Cargos não torna Notas ou
        Frequência mais recentes.
      </p>
      <div className="mt-3 grid gap-2 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6">
        {modulos.map((m) => (
          <div key={m.modulo} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-foreground-muted">{ROTULO_MODULO[m.modulo]}</span>
            <DataFreshnessBadge situacao={m.situacao} />
          </div>
        ))}
      </div>
      {modulosComProblema.length > 0 && (
        <p className="mt-2 text-xs text-warning-subtle-foreground">
          {modulosComProblema.length} módulo(s) atrasado(s) ou sem sincronização — indicadores dependentes podem
          estar desatualizados. A sincronização é feita pela Secretaria.
        </p>
      )}
    </div>
  );
}
