import { getComparativosPorEscola, type ComparativoEscola } from "@/lib/queries/comparativos";
import { getDesempenhoPorEscola } from "@/lib/queries/desempenho";
import { getStatusSincronizacao, ROTULO_MODULO } from "@/lib/queries/qualidade-dados";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import {
  gerarInsightsFrequencia,
  gerarInsightsDesempenho,
  gerarInsightsDistorcao,
  gerarInsightSincronizacao,
  combinarInsightsAtencao,
  agruparInsightsPorEscola,
  type InsightAtencao,
  type EscolaAtencaoInput,
  type SinaisEscola,
} from "@/lib/analytics/atencao";

/**
 * Busca e monta o `EscolaAtencaoInput[]` que as 3 regras por escola de
 * `lib/analytics/atencao.ts` precisam — compartilhado entre
 * `getInsightsAtencao` (rede, com corte de 5) e `getPainelAtencaoEscolas`
 * (Panorama, sem corte, uma linha por escola) para não buscar/mapear os
 * mesmos dados duas vezes.
 */
async function construirEscolasAtencaoInput(
  anoLetivo: number,
): Promise<{ escolas: ComparativoEscola[]; escolasInput: EscolaAtencaoInput[] }> {
  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));

  const [{ escolas }, desempenhos] = await Promise.all([
    getComparativosPorEscola({ anoLetivo, ...janela }),
    getDesempenhoPorEscola({ anoLetivo }),
  ]);

  const abaixoDoEsperadoPorEscola = new Map(desempenhos.map((d) => [d.escolaId, d.percentualAbaixoDoEsperado]));

  const escolasInput: EscolaAtencaoInput[] = escolas
    .filter((e) => e.escolaId !== null)
    .map((e) => ({
      escolaId: e.escolaId as number,
      nomeEscola: e.nomeEscola,
      frequenciaPercentual: e.frequenciaPercentual,
      frequenciaFaixa: e.frequenciaFaixa,
      frequenciaVariacao: e.frequenciaVariacao,
      desempenhoDiferencaRede: e.desempenhoDiferencaRede,
      percentualAbaixoDoEsperado: abaixoDoEsperadoPorEscola.get(e.escolaId) ?? null,
      distorcaoPercentual: e.distorcaoPercentual,
      distorcaoDiferencaRede: e.distorcaoDiferencaRede,
    }));

  return { escolas, escolasInput };
}

/**
 * Monta os insights de "Atenção agora" do dashboard Admin — busca os dados
 * já calculados por `getComparativosPorEscola` (frequência/desempenho/
 * distorção vs. rede) e `getDesempenhoPorEscola` (proporção abaixo do
 * parâmetro, não exposta em `ComparativoEscola`), soma o status de
 * sincronização, e delega a classificação em si para o motor puro de
 * `lib/analytics/atencao.ts`.
 */
export async function getInsightsAtencao(anoLetivo: number, limite = 5): Promise<InsightAtencao[]> {
  const [{ escolasInput }, { modulos }] = await Promise.all([
    construirEscolasAtencaoInput(anoLetivo),
    getStatusSincronizacao(),
  ]);

  const modulosInput = modulos.map((m) => ({
    situacao: m.situacao,
    rotulo: ROTULO_MODULO[m.modulo],
    execucaoIncompleta: m.execucaoIncompleta,
  }));

  return combinarInsightsAtencao(
    [
      gerarInsightsFrequencia(escolasInput, anoLetivo),
      gerarInsightsDesempenho(escolasInput, anoLetivo),
      gerarInsightsDistorcao(escolasInput, anoLetivo),
      gerarInsightSincronizacao(modulosInput),
    ],
    limite,
  );
}

export interface PainelEscolaAtencao extends ComparativoEscola {
  /** Sinais por categoria (frequência/aprendizagem/trajetória) — mesma regra de "Atenção agora", sem corte de 5 e sem score agregado. */
  sinais: SinaisEscola;
}

/**
 * Uma linha por escola com frequência/desempenho/distorção vs. rede (mesmo
 * dado de `getComparativosPorEscola`) + os sinais de "Atenção agora" que
 * aquela escola dispara em cada categoria — para o Panorama das escolas
 * (Bloco D). Roda as MESMAS 3 regras de `getInsightsAtencao`, só que sem o
 * corte de 5 (`combinarInsightsAtencao`), porque o Panorama precisa saber
 * de toda escola com sinal, não só as mais graves da rede. Nenhum cálculo
 * novo: `agruparInsightsPorEscola` só reagrupa os insights já gerados.
 */
export async function getPainelAtencaoEscolas(anoLetivo: number): Promise<PainelEscolaAtencao[]> {
  const { escolas, escolasInput } = await construirEscolasAtencaoInput(anoLetivo);

  const sinaisPorEscola = agruparInsightsPorEscola([
    ...gerarInsightsFrequencia(escolasInput, anoLetivo),
    ...gerarInsightsDesempenho(escolasInput, anoLetivo),
    ...gerarInsightsDistorcao(escolasInput, anoLetivo),
  ]);

  return escolas
    .filter((e): e is ComparativoEscola & { escolaId: number } => e.escolaId !== null)
    .map((e) => ({ ...e, sinais: sinaisPorEscola.get(e.escolaId) ?? {} }));
}

/**
 * Mesmas 3 regras de "Atenção agora" do Admin (frequência, desempenho,
 * distorção), escopadas a uma única escola — para a Home da Direção
 * (`SchoolScope`, ver ETAPA 05). Reaproveita os mesmos motores de
 * `getComparativosPorEscola`/`getDesempenhoPorEscola` e o mesmo motor puro
 * de `lib/analytics/atencao.ts`, só troca os deep-links (Admin aponta para
 * `/admin/escolas/[id]`, Direção não tem essa rota — aponta para a própria
 * tela relevante) e não inclui a regra de sincronização: a Direção não tem
 * um painel de sincronização para agir sobre ela (a saúde por módulo já
 * aparece via `DataFreshnessBadge` na própria Home).
 */
export async function getInsightsAtencaoEscola(
  escolaId: number,
  anoLetivo: number,
  limite = 5,
): Promise<InsightAtencao[]> {
  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));

  const [{ escolas }, desempenhos] = await Promise.all([
    getComparativosPorEscola({ anoLetivo, ...janela }),
    getDesempenhoPorEscola({ anoLetivo }),
  ]);

  const comparativo = escolas.find((e) => e.escolaId === escolaId);
  if (!comparativo) return [];
  const desempenho = desempenhos.find((d) => d.escolaId === escolaId);

  const escolaInput: EscolaAtencaoInput = {
    escolaId,
    nomeEscola: comparativo.nomeEscola,
    frequenciaPercentual: comparativo.frequenciaPercentual,
    frequenciaFaixa: comparativo.frequenciaFaixa,
    frequenciaVariacao: comparativo.frequenciaVariacao,
    desempenhoDiferencaRede: comparativo.desempenhoDiferencaRede,
    percentualAbaixoDoEsperado: desempenho?.percentualAbaixoDoEsperado ?? null,
    distorcaoPercentual: comparativo.distorcaoPercentual,
    distorcaoDiferencaRede: comparativo.distorcaoDiferencaRede,
  };

  return combinarInsightsAtencao(
    [
      gerarInsightsFrequencia([escolaInput], anoLetivo, () => "/portal/direcao/frequencia"),
      gerarInsightsDesempenho([escolaInput], anoLetivo, undefined, undefined, () => "/portal/direcao/notas"),
      gerarInsightsDistorcao([escolaInput], anoLetivo, undefined, () => "/portal/direcao"),
    ],
    limite,
  );
}
