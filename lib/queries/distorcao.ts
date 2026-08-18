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
  /** Null quando a escola do registro daquele ano não bate com nenhuma Escola sincronizada. */
  escolaId: number | null;
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
 * Resolve, para cada matrícula do ano letivo pedido, a escola e a série em
 * que ela de fato estava naquele ano — preferindo os próprios registros de
 * nota daquele ano (que carregam escola/série no momento em que a nota foi
 * lançada) e caindo para o snapshot atual do aluno (`Estudante`) só quando
 * não há nota lançada naquele ano E o aluno ainda está matriculado nesse
 * mesmo ano (`Estudante.ano === anoLetivo`) — ou seja, "ainda não lançaram
 * nota este ano", não "lançaram nota, mas em outra escola".
 *
 * Isso importa porque `Estudante.escolaId`/`turmaSerie` guardam só a
 * matrícula MAIS RECENTE do aluno (ver nota em upsertEstudante em
 * lib/sync/sigeduc-sync.ts) — usá-los direto para um ano anterior atribuiria
 * a distorção de anos passados à escola/turma atual de quem já mudou de
 * escola desde então.
 */
export async function resolverMatriculaPorAno(
  anoLetivo: number,
): Promise<Map<string, { dataNascimento: string | null; escolaId: number | null; serieTexto: string | null }>> {
  const [estudantesDoAno, notasDoAno, escolas] = await Promise.all([
    prisma.estudante.findMany({
      select: { matricula: true, dataNascimento: true, ano: true, turmaSerie: true, escolaId: true },
    }),
    prisma.notaEstudante.findMany({
      where: { ano: anoLetivo },
      distinct: ["estudanteMatricula"],
      select: { estudanteMatricula: true, escola: true, serie: true },
    }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
  ]);

  const idPorNomeEscola = new Map(escolas.map((e) => [e.nome, e.id]));
  const notaPorMatricula = new Map(notasDoAno.map((n) => [n.estudanteMatricula, n]));
  const turmasAtuaisUnicas = Array.from(
    new Set(estudantesDoAno.map((e) => e.turmaSerie).filter((t): t is string => Boolean(t))),
  );
  const seriesPorTurmaAtual = await getSeriePorTurma(turmasAtuaisUnicas);

  const resolvido = new Map<string, { dataNascimento: string | null; escolaId: number | null; serieTexto: string | null }>();
  for (const estudante of estudantesDoAno) {
    const notaDoAno = notaPorMatricula.get(estudante.matricula);
    if (notaDoAno) {
      resolvido.set(estudante.matricula, {
        dataNascimento: estudante.dataNascimento,
        escolaId: notaDoAno.escola ? (idPorNomeEscola.get(notaDoAno.escola) ?? null) : null,
        serieTexto: notaDoAno.serie,
      });
    } else if (estudante.ano === anoLetivo) {
      resolvido.set(estudante.matricula, {
        dataNascimento: estudante.dataNascimento,
        escolaId: estudante.escolaId,
        serieTexto: estudante.turmaSerie ? (seriesPorTurmaAtual.get(estudante.turmaSerie) ?? null) : null,
      });
    }
  }
  return resolvido;
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

  const [matriculaPorAno, escolas] = await Promise.all([
    resolverMatriculaPorAno(filtro.anoLetivo),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
  ]);

  const nomePorEscola = new Map(escolas.map((e) => [e.id, e.nome]));

  interface Acumulado {
    totalElegiveis: number;
    totalForaDoEscopo: number;
    emDistorcao: number;
    intensidadeSevera: number;
  }
  const vazio = (): Acumulado => ({ totalElegiveis: 0, totalForaDoEscopo: 0, emDistorcao: 0, intensidadeSevera: 0 });

  const porEscola = new Map<number | null, Acumulado>();
  const porSerie = new Map<SerieEnsino, Omit<Acumulado, "totalForaDoEscopo" | "intensidadeSevera">>();

  for (const dados of matriculaPorAno.values()) {
    const escolaId = dados.escolaId;
    const acumuladoEscola = porEscola.get(escolaId) ?? vazio();
    porEscola.set(escolaId, acumuladoEscola);

    const serie = normalizarSerie(dados.serieTexto);

    const resultado = serie && dados.dataNascimento
      ? calcularDistorcaoIdadeSerie(dados.dataNascimento, serie, dataReferencia, limiarDistorcaoAnos)
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
    nomeEscola: escolaId === null ? "Escola não identificada" : (nomePorEscola.get(escolaId) ?? `Escola #${escolaId}`),
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
