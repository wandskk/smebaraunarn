import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  GitCompare,
  Percent,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getIndicadoresGeraisRede } from "@/lib/queries/indicadores-gerais";
import { getStatusSincronizacao, ROTULO_MODULO, type StatusModuloSincronizacao } from "@/lib/queries/qualidade-dados";
import {
  getFrequenciaPorEscola,
  calcularJanelaComparativaPadrao,
  resolverDataReferenciaJanela,
  getContagemFaltasConsecutivasPorEscola,
} from "@/lib/queries/frequencia";
import { getDesempenhoPorEscola, NOTA_MINIMA_ESPERADA_PADRAO } from "@/lib/queries/desempenho";
import { getAvaliacoesResumo, TIPO_AVALIACAO_LABEL, STATUS_AVALIACAO_LABEL } from "@/lib/queries/avaliacoes";
import { calcularMediaPonderada } from "@/lib/analytics/comparativos";
import { calcularPercentualFrequencia, calcularVariacaoFrequencia, classificarFaixaFrequencia } from "@/lib/analytics/frequencia";
import { DICIONARIO_INDICADORES, descreverContexto, type ContextoExibicao } from "@/lib/analytics/explicabilidade";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard, type MetricCardTone } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";

interface PageProps {
  searchParams: { ano?: string };
}

const STATUS_AVALIACAO_BADGE_VARIANT: Record<string, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

function formatarPercentual(valor: number | null, casas = 1): string {
  return valor === null ? "-" : `${valor.toFixed(casas)}%`;
}

/** Frequência mais alta é sempre favorável — mesma leitura de .../frequencia/page.tsx. */
function DeltaFrequenciaRede({ diferenca, tendencia }: { diferenca: number; tendencia: "alta" | "queda" | "estavel" }) {
  const texto = `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)} p.p. nos últimos 30 dias`;
  const favoravel = tendencia === "estavel" ? null : tendencia === "alta";
  return <ComparisonDelta diferenca={diferenca} texto={texto} favoravel={favoravel} />;
}

export default async function AdminIndicadoresPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);
  // Preserva o ano letivo selecionado ao navegar para os drill-downs, em vez
  // de deixar cada um cair no próprio padrão (achado do master prompt:
  // "contexto deve ser preservado por query params ao navegar em
  // drill-downs" — ETAPA 02).
  const comAno = (href: string) => `${href}?ano=${anoLetivo}`;

  const janelaFrequencia = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const anoCorrente = anoLetivo === new Date().getFullYear();

  const [indicadores, statusSincronizacao, frequenciaPorEscola, desempenhoPorEscola, avaliacoesRecentes, contagemFaltasConsecutivas] =
    await Promise.all([
      getIndicadoresGeraisRede({ anoLetivo }),
      getStatusSincronizacao(),
      getFrequenciaPorEscola({ anoLetivo, ...janelaFrequencia }),
      getDesempenhoPorEscola({ anoLetivo }),
      getAvaliacoesResumo({ kind: "rede" }),
      anoCorrente ? getContagemFaltasConsecutivasPorEscola() : Promise.resolve(new Map()),
    ]);

  const statusPorModulo = new Map(statusSincronizacao.modulos.map((m) => [m.modulo, m]));

  // Cada indicador cita a data de atualização do MÓDULO de sincronização do
  // qual ele realmente depende — nunca "a última sincronização de qualquer
  // módulo" (regra 7.5 do master prompt).
  const contextoDoModulo = (modulo: StatusModuloSincronizacao["modulo"]): ContextoExibicao => {
    const status = statusPorModulo.get(modulo);
    const dataAtualizacao = status?.ultimoSucessoEm
      ? status.ultimoSucessoEm.toLocaleString("pt-BR")
      : "sem sincronização registrada";
    return { dataAtualizacao, periodoAnalisado: `Ano letivo ${anoLetivo}` };
  };
  const contextoFrequencia = contextoDoModulo("FREQUENCIA");
  const contextoNotas = contextoDoModulo("NOTAS");
  const contextoEstudantes = contextoDoModulo("ESTUDANTES");

  // Frequência "atual" do KPI 1 usa a mesma janela de 30 dias de
  // /admin/indicadores/frequencia e /admin/indicadores/comparativos (não a
  // média do ano inteiro) para poder comparar com o período anterior — "o
  // que mudou recentemente?", não só "qual é a média histórica?".
  let aulasAtualRede = 0;
  let faltasAtualRede = 0;
  let aulasAnteriorRede = 0;
  let faltasAnteriorRede = 0;
  for (const f of frequenciaPorEscola) {
    aulasAtualRede += f.aulasAtual;
    faltasAtualRede += f.faltasAtual;
    aulasAnteriorRede += f.aulasAnterior;
    faltasAnteriorRede += f.faltasAnterior;
  }
  const frequenciaAtualRede = calcularPercentualFrequencia(aulasAtualRede, faltasAtualRede);
  const frequenciaAnteriorRede = calcularPercentualFrequencia(aulasAnteriorRede, faltasAnteriorRede);
  const variacaoFrequenciaRede =
    frequenciaAtualRede !== null && frequenciaAnteriorRede !== null
      ? calcularVariacaoFrequencia(frequenciaAtualRede, frequenciaAnteriorRede)
      : null;
  const faixaFrequenciaRede = frequenciaAtualRede === null ? null : classificarFaixaFrequencia(frequenciaAtualRede);
  const toneFrequencia: MetricCardTone =
    faixaFrequenciaRede === "critica" ? "critico" : faixaFrequenciaRede === "atencao" ? "atencao" : "default";

  const percentualAbaixoParametroRede = calcularMediaPonderada(
    desempenhoPorEscola
      .filter((d) => d.percentualAbaixoDoEsperado !== null)
      .map((d) => ({ valor: d.percentualAbaixoDoEsperado as number, peso: d.totalNotasLancadas })),
  );

  const faixaFrequenciaDistorcao: MetricCardTone = indicadores.estudantesEmDistorcaoIdadeSerie > 0 ? "atencao" : "default";
  const percentualDistorcaoRede =
    indicadores.estudantesElegiveisDistorcao > 0
      ? (indicadores.estudantesEmDistorcaoIdadeSerie / indicadores.estudantesElegiveisDistorcao) * 100
      : null;

  let totalFaltasConsecutivas = 0;
  let totalCriticoFaltasConsecutivas = 0;
  for (const contagem of contagemFaltasConsecutivas.values()) {
    totalFaltasConsecutivas += contagem.total;
    totalCriticoFaltasConsecutivas += contagem.critico;
  }
  const toneFaltasConsecutivas: MetricCardTone =
    totalCriticoFaltasConsecutivas > 0 ? "critico" : totalFaltasConsecutivas > 0 ? "atencao" : "default";

  const modulosEmDia = statusSincronizacao.modulos.filter((m) => m.situacao === "em-dia");
  const modulosAtrasados = statusSincronizacao.modulos.filter((m) => m.situacao !== "em-dia");

  return (
    <div>
      <PageHeader
        title="Centro de Inteligência Educacional"
        description="Visão executiva da rede municipal para acompanhar resultados, identificar mudanças e localizar pontos que merecem investigação."
        actions={
          <>
            {anosDisponiveis.length > 1 && (
              <form method="get" className="flex items-center gap-2">
                <Select name="ano" defaultValue={anoLetivo} className="w-auto">
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
            )}
            <Link href="/admin/indicadores/qualidade" className={buttonVariants({ variant: "secondary" })}>
              <ShieldCheck className="h-4 w-4" />
              Qualidade dos dados
            </Link>
            <Link href={comAno("/admin/indicadores/comparativos")} className={buttonVariants({ variant: "secondary" })}>
              <GitCompare className="h-4 w-4" />
              Comparar escolas
            </Link>
          </>
        }
      />

      <p className="mt-4 text-sm text-foreground-muted">
        {formatNumber(indicadores.totalEstudantes)} estudantes · {formatNumber(indicadores.escolasAtivas)} escolas ·{" "}
        {formatNumber(indicadores.totalTurmas)} turmas · Ano letivo {anoLetivo}
      </p>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Pulso da rede</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Os principais sinais educacionais do recorte selecionado.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-up" style={{ "--stagger-delay": "0ms" } as React.CSSProperties}>
            <MetricCard
              label="Frequência média da rede"
              value={formatarPercentual(frequenciaAtualRede)}
              icon={Percent}
              tone={toneFrequencia}
              accent="attendance"
              href={comAno("/admin/indicadores/frequencia")}
              explicacao={descreverContexto(DICIONARIO_INDICADORES.frequenciaMedia, contextoFrequencia)}
              helpText={
                <div className="flex flex-col gap-1">
                  {variacaoFrequenciaRede ? (
                    <DeltaFrequenciaRede
                      diferenca={variacaoFrequenciaRede.diferencaPontosPercentuais}
                      tendencia={variacaoFrequenciaRede.tendencia}
                    />
                  ) : (
                    <span className="text-foreground-muted/60">sem histórico suficiente para tendência</span>
                  )}
                  <span>Ver frequência →</span>
                </div>
              }
            />
          </div>
          <div className="animate-fade-in-up" style={{ "--stagger-delay": "50ms" } as React.CSSProperties}>
            <MetricCard
              label="Desempenho médio"
              value={indicadores.desempenhoMedioRede === null ? "-" : indicadores.desempenhoMedioRede.toFixed(1)}
              icon={Award}
              accent="education"
              href={comAno("/admin/indicadores/aprendizagem")}
              explicacao={descreverContexto(DICIONARIO_INDICADORES.desempenhoMedio, contextoNotas)}
              helpText={
                <div className="flex flex-col gap-1">
                  <span>
                    {percentualAbaixoParametroRede === null
                      ? "sem notas suficientes para calcular"
                      : `${percentualAbaixoParametroRede.toFixed(0)}% das notas abaixo do parâmetro de trabalho (${NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)})`}
                  </span>
                  <span>Ver aprendizagem →</span>
                </div>
              }
            />
          </div>
          <div className="animate-fade-in-up" style={{ "--stagger-delay": "100ms" } as React.CSSProperties}>
            <MetricCard
              label="Distorção idade-série"
              value={formatarPercentual(percentualDistorcaoRede)}
              icon={TrendingDown}
              tone={faixaFrequenciaDistorcao}
              accent="warning"
              href={comAno("/admin/indicadores/fluxo-trajetoria")}
              explicacao={descreverContexto(DICIONARIO_INDICADORES.distorcaoIdadeSerie, contextoEstudantes)}
              helpText={
                <div className="flex flex-col gap-1">
                  <span>{formatNumber(indicadores.estudantesEmDistorcaoIdadeSerie)} estudante(s) elegível(is) em distorção</span>
                  <span>Ver fluxo e trajetória →</span>
                </div>
              }
            />
          </div>
          <div className="animate-fade-in-up" style={{ "--stagger-delay": "150ms" } as React.CSSProperties}>
            <MetricCard
              label="Faltas consecutivas agora"
              value={anoCorrente ? formatNumber(totalFaltasConsecutivas) : "-"}
              icon={AlertTriangle}
              tone={toneFaltasConsecutivas}
              accent="attendance"
              href={comAno("/admin/indicadores/frequencia")}
              explicacao={descreverContexto(DICIONARIO_INDICADORES.faltasConsecutivas, contextoFrequencia)}
              helpText={
                <div className="flex flex-col gap-1">
                  <span>
                    {anoCorrente
                      ? `com sequência recente de 3+ faltas${totalCriticoFaltasConsecutivas > 0 ? ` (${totalCriticoFaltasConsecutivas} crítico)` : ""}`
                      : "sinal de 'agora', só disponível para o ano letivo corrente"}
                  </span>
                  <span>Investigar frequência →</span>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-foreground-muted">
        O bloco &quot;Atenção agora&quot; (destaque automático de escolas/turmas com queda recente, direto neste
        painel) ainda não existe. Frequência, desempenho e distorção por escola no mesmo recorte já estão
        disponíveis lado a lado em{" "}
        <Link href={comAno("/admin/indicadores/comparativos")} className="text-primary underline">
          Comparar escolas
        </Link>{" "}
        — o destaque automático nesta página fica para a próxima etapa (ver
        docs/mvp-indicadores-inteligentes/PROGRESSO.md).
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Avaliações municipais</h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Resultados próprios do município integrados ao mesmo ambiente de análise da rede.
          </p>

          {avaliacoesRecentes.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-5 text-sm text-foreground-muted">
              Nenhuma avaliação municipal com resultado registrado neste ano letivo.
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {avaliacoesRecentes.slice(0, 4).map((avaliacao) => (
                <Link
                  key={avaliacao.avaliacaoId}
                  href={`/admin/avaliacoes/${avaliacao.avaliacaoId}`}
                  className="block rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-education-subtle">
                      <ClipboardList className="h-4 w-4 text-education" />
                    </span>
                    <Badge variant={STATUS_AVALIACAO_BADGE_VARIANT[avaliacao.status]}>
                      {STATUS_AVALIACAO_LABEL[avaliacao.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm font-medium text-foreground">{avaliacao.nome}</div>
                  <div className="mt-0.5 text-xs text-foreground-muted">
                    {TIPO_AVALIACAO_LABEL[avaliacao.tipo]} · {avaliacao.etapaEnsino ?? "etapa não informada"} ·{" "}
                    {avaliacao.ano}
                  </div>
                  <div className="mt-2 text-xs text-foreground-muted">
                    {formatNumber(avaliacao.totalResultados)} de {formatNumber(avaliacao.totalEsperado) || "?"}{" "}
                    resultado(s) registrado(s) · atualizado em {avaliacao.ultimaAtualizacao.toLocaleDateString("pt-BR")}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {avaliacoesRecentes.length > 0 && (
            <Link href="/admin/avaliacoes" className="mt-3 inline-block text-sm text-primary hover:underline">
              Ver todas as avaliações →
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Confiabilidade dos dados</h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Os indicadores dependem de diferentes módulos do SIGEduc e podem ter datas de atualização diferentes.
          </p>

          <div className="mt-3 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {modulosEmDia.length} de {statusSincronizacao.modulos.length}
            </div>
            <div className="mt-0.5 text-xs text-foreground-muted">módulos em dia</div>

            {modulosAtrasados.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {modulosAtrasados.map((m) => (
                  <span key={m.modulo} className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                    {ROTULO_MODULO[m.modulo]}
                    <DataFreshnessBadge situacao={m.situacao} />
                  </span>
                ))}
              </div>
            )}

            <Link href="/admin/indicadores/qualidade" className="mt-3 inline-block text-sm text-primary hover:underline">
              Abrir qualidade dos dados →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground-muted/70">
        {formatNumber(indicadores.estudantesForaDoEscopoOuSemDadosParaDistorcao)} estudante(s) fora do escopo do
        cálculo de distorção idade-série (Educação Infantil, EJA, Educação Especial, turmas multianuais, trilha
        Trajetória de Sucesso, ou com data de nascimento ausente/inválida) — não entram na contagem acima.
      </p>
    </div>
  );
}
