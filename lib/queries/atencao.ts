import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { getDesempenhoPorEscola } from "@/lib/queries/desempenho";
import { getStatusSincronizacao, ROTULO_MODULO } from "@/lib/queries/qualidade-dados";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import {
  gerarInsightsFrequencia,
  gerarInsightsDesempenho,
  gerarInsightsDistorcao,
  gerarInsightSincronizacao,
  combinarInsightsAtencao,
  type InsightAtencao,
  type EscolaAtencaoInput,
} from "@/lib/analytics/atencao";

/**
 * Monta os insights de "Atenção agora" do dashboard Admin — busca os dados
 * já calculados por `getComparativosPorEscola` (frequência/desempenho/
 * distorção vs. rede) e `getDesempenhoPorEscola` (proporção abaixo do
 * parâmetro, não exposta em `ComparativoEscola`), soma o status de
 * sincronização, e delega a classificação em si para o motor puro de
 * `lib/analytics/atencao.ts`.
 */
export async function getInsightsAtencao(anoLetivo: number, limite = 5): Promise<InsightAtencao[]> {
  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));

  const [{ escolas }, desempenhos, { modulos }] = await Promise.all([
    getComparativosPorEscola({ anoLetivo, ...janela }),
    getDesempenhoPorEscola({ anoLetivo }),
    getStatusSincronizacao(),
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
