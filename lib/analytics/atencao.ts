import type { FaixaFrequencia, VariacaoFrequencia } from "./frequencia";
import type { SituacaoSincronizacao } from "./qualidade-dados";

/**
 * Motor puro do "Atenção agora" do dashboard Admin — 4 regras explicáveis
 * (frequência, desempenho, distorção, sincronização), sem score agregado
 * opaco (regra 7.6 do master prompt: cada insight expõe fato, valor,
 * referência, período, motivo e deep-link). Dinâmico, recalculado a cada
 * carregamento da página — não persiste nada (o próprio DOCX de Admin
 * recomenda validar as regras antes de criar um modelo `AlertaAnalitico`).
 */

export type SeveridadeAtencao = "critico" | "atencao";

export interface InsightAtencao {
  id: string;
  severidade: SeveridadeAtencao;
  /** Fato + valor + referência já formatados (ex.: "Escola X: frequência 72,4%, -6,1 p.p. vs período anterior"). */
  titulo: string;
  /** Por que este fato merece atenção. */
  motivo: string;
  periodo: string;
  href: string;
}

export interface EscolaAtencaoInput {
  escolaId: number;
  nomeEscola: string;
  frequenciaPercentual: number | null;
  frequenciaFaixa: FaixaFrequencia | null;
  frequenciaVariacao: VariacaoFrequencia | null;
  desempenhoDiferencaRede: number | null;
  percentualAbaixoDoEsperado: number | null;
  distorcaoPercentual: number | null;
  distorcaoDiferencaRede: number | null;
}

export interface ModuloSincronizacaoInput {
  situacao: SituacaoSincronizacao;
  rotulo: string;
  /** Log mais recente ficou "PROCESSANDO" tempo demais — ver lib/analytics/qualidade-dados.ts:execucaoIncompleta. */
  execucaoIncompleta: boolean;
}

function hrefEscola(escolaId: number, anoLetivo: number): string {
  return `/admin/escolas/${escolaId}?ano=${anoLetivo}`;
}

/** Regra 1: frequência fora da faixa adequada e em queda no período mais recente. */
export function gerarInsightsFrequencia(escolas: EscolaAtencaoInput[], anoLetivo: number): InsightAtencao[] {
  const periodo = `Ano letivo ${anoLetivo}`;
  const insights: InsightAtencao[] = [];

  for (const e of escolas) {
    if (!e.frequenciaFaixa || e.frequenciaFaixa === "adequada") continue;
    if (!e.frequenciaVariacao || e.frequenciaVariacao.tendencia !== "queda") continue;
    if (e.frequenciaPercentual === null) continue;

    const { diferencaPontosPercentuais } = e.frequenciaVariacao;
    insights.push({
      id: `frequencia-${e.escolaId}`,
      severidade: e.frequenciaFaixa === "critica" ? "critico" : "atencao",
      titulo: `${e.nomeEscola}: frequência ${e.frequenciaPercentual.toFixed(1)}%, ${diferencaPontosPercentuais > 0 ? "+" : ""}${diferencaPontosPercentuais.toFixed(1)} p.p. vs período anterior`,
      motivo: `Frequência na faixa "${e.frequenciaFaixa}" e em queda no período mais recente.`,
      periodo,
      href: hrefEscola(e.escolaId, anoLetivo),
    });
  }

  return insights;
}

/** Regra 2: desempenho abaixo da rede e proporção elevada de notas abaixo do parâmetro esperado. */
export function gerarInsightsDesempenho(
  escolas: EscolaAtencaoInput[],
  anoLetivo: number,
  limiarDiferencaRede = -0.3,
  limiarPercentualAbaixo = 40,
): InsightAtencao[] {
  const periodo = `Ano letivo ${anoLetivo}`;
  const insights: InsightAtencao[] = [];

  for (const e of escolas) {
    if (e.desempenhoDiferencaRede === null || e.percentualAbaixoDoEsperado === null) continue;
    if (e.desempenhoDiferencaRede >= limiarDiferencaRede) continue;
    if (e.percentualAbaixoDoEsperado < limiarPercentualAbaixo) continue;

    insights.push({
      id: `desempenho-${e.escolaId}`,
      severidade: e.percentualAbaixoDoEsperado >= 60 ? "critico" : "atencao",
      titulo: `${e.nomeEscola}: desempenho ${e.desempenhoDiferencaRede.toFixed(1)} pts vs rede, ${e.percentualAbaixoDoEsperado.toFixed(0)}% das notas abaixo do parâmetro`,
      motivo: "Desempenho abaixo da referência de rede, com proporção elevada de notas abaixo do parâmetro esperado.",
      periodo,
      href: hrefEscola(e.escolaId, anoLetivo),
    });
  }

  return insights;
}

/** Regra 3: distorção idade-série bem acima da referência de rede. */
export function gerarInsightsDistorcao(
  escolas: EscolaAtencaoInput[],
  anoLetivo: number,
  limiarDiferencaRede = 5,
): InsightAtencao[] {
  const periodo = `Ano letivo ${anoLetivo}`;
  const insights: InsightAtencao[] = [];

  for (const e of escolas) {
    if (e.distorcaoPercentual === null || e.distorcaoDiferencaRede === null) continue;
    if (e.distorcaoDiferencaRede < limiarDiferencaRede) continue;

    insights.push({
      id: `distorcao-${e.escolaId}`,
      severidade: e.distorcaoDiferencaRede >= 10 ? "critico" : "atencao",
      titulo: `${e.nomeEscola}: distorção idade-série ${e.distorcaoPercentual.toFixed(1)}%, ${e.distorcaoDiferencaRede.toFixed(1)} p.p. acima da rede`,
      motivo: "Proporção de estudantes em distorção idade-série bem acima da referência de rede.",
      periodo,
      href: hrefEscola(e.escolaId, anoLetivo),
    });
  }

  return insights;
}

/**
 * Regra 4: módulo(s) de sincronização atrasado(s), nunca sincronizados, ou
 * com execução travada (log mais recente preso em "PROCESSANDO") — dados
 * podem estar desatualizados ou incompletos mesmo que o último SUCESSO
 * pareça recente.
 */
export function gerarInsightSincronizacao(modulos: ModuloSincronizacaoInput[]): InsightAtencao[] {
  const comProblema = modulos.filter((m) => m.situacao !== "em-dia" || m.execucaoIncompleta);
  if (comProblema.length === 0) return [];

  const travados = comProblema.filter((m) => m.execucaoIncompleta);
  const nomes = comProblema.map((m) => m.rotulo).join(", ");
  const motivo =
    travados.length > 0
      ? `Execução travada em "PROCESSANDO" sem SUCESSO final: ${travados.map((m) => m.rotulo).join(", ")}. Indicadores dependentes podem estar incompletos.`
      : "Indicadores que dependem desses módulos podem estar desatualizados.";

  return [
    {
      id: "sincronizacao",
      severidade: travados.length > 0 || comProblema.some((m) => m.situacao === "sem-sincronizacao") ? "critico" : "atencao",
      titulo: `Sincronização com atraso: ${nomes}`,
      motivo,
      periodo: "Agora",
      href: "/admin/sincronizacao",
    },
  ];
}

const PESO_SEVERIDADE: Record<SeveridadeAtencao, number> = { critico: 0, atencao: 1 };

/** Junta os grupos de insights, prioriza crítico sobre atenção e limita o total exibido. */
export function combinarInsightsAtencao(grupos: InsightAtencao[][], limite = 5): InsightAtencao[] {
  return grupos
    .flat()
    .sort((a, b) => PESO_SEVERIDADE[a.severidade] - PESO_SEVERIDADE[b.severidade])
    .slice(0, limite);
}
