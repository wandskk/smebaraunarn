import { calcularPercentualFrequencia, type FaixaFrequencia, type VariacaoFrequencia } from "@/lib/analytics/frequencia";
import { calcularMediaPonderada, calcularDiferencaParaRede } from "@/lib/analytics/comparativos";
import { getFrequenciaPorEscola, type JanelaComparativa } from "@/lib/queries/frequencia";
import { getDesempenhoPorEscola, type FiltroDesempenhoPorEscola } from "@/lib/queries/desempenho";
import { getDistorcaoPorEscolaESerie, type FiltroDistorcao } from "@/lib/queries/distorcao";

export interface FiltroComparativos extends JanelaComparativa {
  anoLetivo: number;
  notaMinimaEsperada?: FiltroDesempenhoPorEscola["notaMinimaEsperada"];
  dataReferenciaDistorcao?: FiltroDistorcao["dataReferencia"];
  limiarDistorcaoAnos?: FiltroDistorcao["limiarDistorcaoAnos"];
}

export interface ComparativoEscola {
  /** Null quando a escola não bate com nenhuma Escola sincronizada (registro de nota/distorção sem correspondência). */
  escolaId: number | null;
  nomeEscola: string;
  frequenciaPercentual: number | null;
  frequenciaDiferencaRede: number | null;
  frequenciaVariacao: VariacaoFrequencia | null;
  frequenciaFaixa: FaixaFrequencia | null;
  desempenhoMedia: number | null;
  desempenhoDiferencaRede: number | null;
  distorcaoPercentual: number | null;
  distorcaoDiferencaRede: number | null;
}

export interface ReferenciaRede {
  frequenciaPercentual: number | null;
  desempenhoMedia: number | null;
  distorcaoPercentual: number | null;
}

export interface ResultadoComparativos {
  escolas: ComparativoEscola[];
  rede: ReferenciaRede;
}

/**
 * Uma linha por escola comparando frequência, desempenho e distorção
 * idade-série com a referência de rede no mesmo recorte (mesmo ano letivo,
 * mesma janela de frequência) — responde "essa escola está acima ou abaixo
 * da rede?" em vez de só mostrar o número isolado (ver
 * centro_indicadores_educacionais.md, comparativos escola × rede).
 *
 * A referência de rede de cada indicador é uma média ponderada pelo
 * "tamanho" de cada escola no indicador (aulas dadas para frequência, notas
 * lançadas para desempenho, estudantes elegíveis para distorção) — não a
 * média simples dos percentuais já calculados por escola, que daria peso
 * igual a uma escola de 20 alunos e a uma de 400.
 */
export async function getComparativosPorEscola(filtro: FiltroComparativos): Promise<ResultadoComparativos> {
  const [frequencias, desempenhos, distorcoes] = await Promise.all([
    getFrequenciaPorEscola({
      anoLetivo: filtro.anoLetivo,
      atualInicio: filtro.atualInicio,
      atualFim: filtro.atualFim,
      anteriorInicio: filtro.anteriorInicio,
      anteriorFim: filtro.anteriorFim,
    }),
    getDesempenhoPorEscola({ anoLetivo: filtro.anoLetivo, notaMinimaEsperada: filtro.notaMinimaEsperada }),
    getDistorcaoPorEscolaESerie({
      anoLetivo: filtro.anoLetivo,
      dataReferencia: filtro.dataReferenciaDistorcao,
      limiarDistorcaoAnos: filtro.limiarDistorcaoAnos,
    }),
  ]);

  const frequenciaPorEscola = new Map(frequencias.map((f) => [f.escolaId, f]));
  const desempenhoPorEscola = new Map(desempenhos.map((d) => [d.escolaId, d]));
  const distorcaoPorEscola = new Map(distorcoes.porEscola.map((d) => [d.escolaId, d]));

  const nomePorEscola = new Map<number | null, string>();
  for (const f of frequencias) nomePorEscola.set(f.escolaId, f.nomeEscola);
  for (const d of desempenhos) nomePorEscola.set(d.escolaId, d.nomeEscola);
  for (const d of distorcoes.porEscola) nomePorEscola.set(d.escolaId, d.nomeEscola);

  let aulasRede = 0;
  let faltasRede = 0;
  for (const f of frequencias) {
    aulasRede += f.aulasAtual;
    faltasRede += f.faltasAtual;
  }
  const frequenciaPercentualRede = calcularPercentualFrequencia(aulasRede, faltasRede);

  const desempenhoMediaRede = calcularMediaPonderada(
    desempenhos.filter((d) => d.media !== null).map((d) => ({ valor: d.media as number, peso: d.totalNotasLancadas })),
  );

  const distorcaoPercentualRede = calcularMediaPonderada(
    distorcoes.porEscola
      .filter((d) => d.percentualDistorcao !== null)
      .map((d) => ({ valor: d.percentualDistorcao as number, peso: d.totalElegiveis })),
  );

  const escolaIds = Array.from(nomePorEscola.keys()).sort((a, b) =>
    (nomePorEscola.get(a) ?? "").localeCompare(nomePorEscola.get(b) ?? ""),
  );

  const escolas: ComparativoEscola[] = escolaIds.map((escolaId) => {
    const frequencia = frequenciaPorEscola.get(escolaId);
    const desempenho = desempenhoPorEscola.get(escolaId);
    const distorcao = distorcaoPorEscola.get(escolaId);

    return {
      escolaId,
      nomeEscola: nomePorEscola.get(escolaId) ?? (escolaId === null ? "Escola não identificada" : `Escola #${escolaId}`),
      frequenciaPercentual: frequencia?.percentualAtual ?? null,
      frequenciaDiferencaRede: calcularDiferencaParaRede(frequencia?.percentualAtual, frequenciaPercentualRede),
      frequenciaVariacao: frequencia?.variacao ?? null,
      frequenciaFaixa: frequencia?.faixa ?? null,
      desempenhoMedia: desempenho?.media ?? null,
      desempenhoDiferencaRede: calcularDiferencaParaRede(desempenho?.media, desempenhoMediaRede),
      distorcaoPercentual: distorcao?.percentualDistorcao ?? null,
      distorcaoDiferencaRede: calcularDiferencaParaRede(distorcao?.percentualDistorcao, distorcaoPercentualRede),
    };
  });

  return {
    escolas,
    rede: {
      frequenciaPercentual: frequenciaPercentualRede,
      desempenhoMedia: desempenhoMediaRede,
      distorcaoPercentual: distorcaoPercentualRede,
    },
  };
}
