import { prisma } from "@/lib/prisma";
import {
  calcularDistorcaoIdadeSerie,
  classificarIntensidadeDefasagem,
  IDADE_ESPERADA_POR_SERIE,
  LIMIAR_DISTORCAO_ANOS,
  type SerieEnsino,
} from "@/lib/analytics/distorcao";
import { normalizarSerie } from "@/lib/analytics/mapeamento-serie";
import { getSeriePorTurma } from "@/lib/queries/academico";

export interface FiltroDistorcao {
  anoLetivo: number;
  /** YYYY-MM-DD. Sem valor, usa 31/03 do ano letivo — ver lib/queries/indicadores-gerais.ts. */
  dataReferencia?: string;
  limiarDistorcaoAnos?: number;
}

export interface DistorcaoEscola {
  escolaId: number;
  nomeEscola: string;
  /** Estudantes com série regular mapeada e data de nascimento válida — só eles entram no percentual. */
  totalElegiveis: number;
  totalForaDoEscopo: number;
  emDistorcao: number;
  /** emDistorcao / totalElegiveis × 100. Null se não houver elegíveis. */
  percentualDistorcao: number | null;
  intensidadeSevera: number;
}

export interface DistorcaoSerie {
  serie: SerieEnsino;
  totalElegiveis: number;
  emDistorcao: number;
  percentualDistorcao: number | null;
}

export interface ResultadoDistorcaoRede {
  porEscola: DistorcaoEscola[];
  porSerie: DistorcaoSerie[];
}

function calcularDataReferenciaPadrao(anoLetivo: number): string {
  return `${anoLetivo}-03-31`;
}

/**
 * Distorção idade-série quebrada por escola e por série — responde "onde
 * está a maior concentração?" e "em qual etapa ela começa a crescer?" (ver
 * centro_indicadores_educacionais.md §7). Reaproveita o mesmo motor puro e a
 * mesma resolução de série já usados em lib/queries/indicadores-gerais.ts;
 * aqui só muda o agrupamento do resultado (por escola/série em vez de só
 * o total da rede).
 */
export async function getDistorcaoPorEscolaESerie(filtro: FiltroDistorcao): Promise<ResultadoDistorcaoRede> {
  const dataReferencia = filtro.dataReferencia ?? calcularDataReferenciaPadrao(filtro.anoLetivo);
  const limiarDistorcaoAnos = filtro.limiarDistorcaoAnos ?? LIMIAR_DISTORCAO_ANOS;

  const [estudantes, escolas] = await Promise.all([
    prisma.estudante.findMany({
      where: { ano: filtro.anoLetivo },
      select: { dataNascimento: true, turmaSerie: true, escolaId: true },
    }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
  ]);

  const nomePorEscola = new Map(escolas.map((e) => [e.id, e.nome]));
  const turmasUnicas = Array.from(new Set(estudantes.map((e) => e.turmaSerie).filter((t): t is string => Boolean(t))));
  const seriesPorTurma = await getSeriePorTurma(turmasUnicas);

  interface Acumulado {
    totalElegiveis: number;
    totalForaDoEscopo: number;
    emDistorcao: number;
    intensidadeSevera: number;
  }
  const vazio = (): Acumulado => ({ totalElegiveis: 0, totalForaDoEscopo: 0, emDistorcao: 0, intensidadeSevera: 0 });

  const porEscola = new Map<number, Acumulado>();
  const porSerie = new Map<SerieEnsino, Omit<Acumulado, "totalForaDoEscopo" | "intensidadeSevera">>();

  for (const estudante of estudantes) {
    const acumuladoEscola = porEscola.get(estudante.escolaId) ?? vazio();
    porEscola.set(estudante.escolaId, acumuladoEscola);

    const serieTexto = estudante.turmaSerie ? (seriesPorTurma.get(estudante.turmaSerie) ?? null) : null;
    const serie = normalizarSerie(serieTexto);

    const resultado = serie && estudante.dataNascimento
      ? calcularDistorcaoIdadeSerie(estudante.dataNascimento, serie, dataReferencia, limiarDistorcaoAnos)
      : null;

    if (resultado === null || !serie) {
      acumuladoEscola.totalForaDoEscopo += 1;
      continue;
    }

    acumuladoEscola.totalElegiveis += 1;

    const acumuladoSerie = porSerie.get(serie) ?? { totalElegiveis: 0, emDistorcao: 0 };
    acumuladoSerie.totalElegiveis += 1;
    porSerie.set(serie, acumuladoSerie);

    if (resultado.emDistorcao) {
      acumuladoEscola.emDistorcao += 1;
      acumuladoSerie.emDistorcao += 1;
      if (classificarIntensidadeDefasagem(resultado.defasagemAnos) === "severa") {
        acumuladoEscola.intensidadeSevera += 1;
      }
    }
  }

  const resultadoPorEscola: DistorcaoEscola[] = Array.from(porEscola.entries()).map(([escolaId, dados]) => ({
    escolaId,
    nomeEscola: nomePorEscola.get(escolaId) ?? `Escola #${escolaId}`,
    totalElegiveis: dados.totalElegiveis,
    totalForaDoEscopo: dados.totalForaDoEscopo,
    emDistorcao: dados.emDistorcao,
    percentualDistorcao: dados.totalElegiveis > 0 ? (dados.emDistorcao / dados.totalElegiveis) * 100 : null,
    intensidadeSevera: dados.intensidadeSevera,
  }));
  resultadoPorEscola.sort((a, b) => (b.percentualDistorcao ?? -1) - (a.percentualDistorcao ?? -1));

  const ordemSerie = Object.keys(IDADE_ESPERADA_POR_SERIE) as SerieEnsino[];
  const resultadoPorSerie: DistorcaoSerie[] = ordemSerie
    .filter((serie) => porSerie.has(serie))
    .map((serie) => {
      const dados = porSerie.get(serie)!;
      return {
        serie,
        totalElegiveis: dados.totalElegiveis,
        emDistorcao: dados.emDistorcao,
        percentualDistorcao: dados.totalElegiveis > 0 ? (dados.emDistorcao / dados.totalElegiveis) * 100 : null,
      };
    });

  return { porEscola: resultadoPorEscola, porSerie: resultadoPorSerie };
}
