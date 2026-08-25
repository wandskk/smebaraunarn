import { prisma } from "@/lib/prisma";
import {
  calcularPercentualFrequencia,
  classificarFaixaFrequencia,
  FAIXAS_PADRAO_FREQUENCIA,
  type FaixasFrequencia,
} from "@/lib/analytics/frequencia";
import { calcularDistorcaoIdadeSerie, LIMIAR_DISTORCAO_ANOS } from "@/lib/analytics/distorcao";
import { normalizarSerie } from "@/lib/analytics/mapeamento-serie";
import { resolverMatriculaPorAno } from "@/lib/queries/distorcao";

export interface ParametrosIndicadoresGerais {
  anoLetivo: number;
  /**
   * Data de referência (YYYY-MM-DD) para o cálculo de distorção
   * idade-série. Sem valor informado, usa 31/03 do ano letivo — convenção
   * usual do INEP, ainda não confirmada formalmente para o município (ver
   * docs/PLANO_DESENVOLVIMENTO.md §8.1).
   */
  dataReferenciaDistorcao?: string;
  faixasFrequencia?: FaixasFrequencia;
  limiarDistorcaoAnos?: number;
}

export interface IndicadoresGeraisRede {
  totalEstudantes: number;
  escolasAtivas: number;
  totalTurmas: number;
  /** Percentual (0-100). Null se não houver nenhum registro de frequência no ano. */
  frequenciaMediaRede: number | null;
  estudantesAbaixoFaixaFrequencia: number;
  /** Média simples das notas lançadas no ano. Null se não houver nenhuma nota. */
  desempenhoMedioRede: number | null;
  estudantesEmDistorcaoIdadeSerie: number;
  /** Estudantes com série mapeada e data de nascimento válida — a base sobre a qual o percentual de distorção é calculado (denominador). */
  estudantesElegiveisDistorcao: number;
  /**
   * Estudantes cuja turma está fora do escopo do indicador de distorção
   * (Educação Infantil, EJA, Educação Especial, turmas multianuais e
   * "Trajetória de Sucesso" — nenhuma delas tem uma única idade esperada
   * bem definida) somados aos que têm dado de nascimento ausente ou
   * corrompido. Exposto separadamente para não maquiar o indicador: ver
   * lib/analytics/mapeamento-serie.ts para a lista de casos e
   * centro_indicadores_educacionais.md §19 sobre transparência de dados
   * incompletos.
   */
  estudantesForaDoEscopoOuSemDadosParaDistorcao: number;
}

function calcularDataReferenciaPadrao(anoLetivo: number): string {
  return `${anoLetivo}-03-31`;
}

export async function getIndicadoresGeraisRede(
  parametros: ParametrosIndicadoresGerais,
): Promise<IndicadoresGeraisRede> {
  const { anoLetivo } = parametros;
  const dataReferenciaDistorcao = parametros.dataReferenciaDistorcao ?? calcularDataReferenciaPadrao(anoLetivo);
  const faixasFrequencia = parametros.faixasFrequencia ?? FAIXAS_PADRAO_FREQUENCIA;
  const limiarDistorcaoAnos = parametros.limiarDistorcaoAnos ?? LIMIAR_DISTORCAO_ANOS;

  const [estudantesDoAno, frequenciaPorEstudante, desempenhoAgregado] = await Promise.all([
    prisma.estudante.findMany({
      where: { ano: anoLetivo },
      select: { matricula: true, dataNascimento: true, turmaSerie: true, escolaId: true },
    }),
    // Filtra por data (ano civil), não por `estudante: { ano: anoLetivo } }`:
    // esse join soma TODA a frequência já sincronizada de quem tem essa
    // matrícula vigente hoje, sem limite de data — para um aluno com vários
    // anos de histórico, isso somaria anos diferentes juntos.
    prisma.frequenciaEstudante.groupBy({
      by: ["estudanteMatricula"],
      where: { data: { gte: `${anoLetivo}-01-01`, lte: `${anoLetivo}-12-31` } },
      _sum: { falta: true, quantidadeAula: true },
    }),
    prisma.notaEstudante.aggregate({
      where: { ano: anoLetivo },
      _avg: { nota: true },
    }),
  ]);

  const totalEstudantes = estudantesDoAno.length;
  const escolasAtivas = new Set(estudantesDoAno.map((e) => e.escolaId)).size;
  const turmasUnicas = Array.from(
    new Set(estudantesDoAno.map((e) => e.turmaSerie).filter((t): t is string => Boolean(t))),
  );
  const totalTurmas = turmasUnicas.length;

  let totalAulasRede = 0;
  let totalFaltasRede = 0;
  let estudantesAbaixoFaixaFrequencia = 0;
  for (const registro of frequenciaPorEstudante) {
    const aulas = registro._sum.quantidadeAula ?? 0;
    const faltas = registro._sum.falta ?? 0;
    totalAulasRede += aulas;
    totalFaltasRede += faltas;

    const percentual = calcularPercentualFrequencia(aulas, faltas);
    if (percentual !== null && classificarFaixaFrequencia(percentual, faixasFrequencia) !== "adequada") {
      estudantesAbaixoFaixaFrequencia += 1;
    }
  }
  const frequenciaMediaRede = calcularPercentualFrequencia(totalAulasRede, totalFaltasRede);

  // Distorção usa uma resolução de série própria (mesma de
  // lib/queries/distorcao.ts): prefere a série do próprio registro de nota
  // daquele ano em vez de `Estudante.turmaSerie` (que só guarda a matrícula
  // mais recente do aluno) — necessário para o ano letivo poder ser
  // histórico, não só o corrente.
  const matriculaPorAno = await resolverMatriculaPorAno(anoLetivo);
  let estudantesEmDistorcaoIdadeSerie = 0;
  let estudantesForaDoEscopoOuSemDadosParaDistorcao = 0;
  let estudantesElegiveisDistorcao = 0;
  for (const dados of matriculaPorAno.values()) {
    const serie = normalizarSerie(dados.serieTexto);

    const resultado = serie && dados.dataNascimento
      ? calcularDistorcaoIdadeSerie(dados.dataNascimento, serie, dataReferenciaDistorcao, limiarDistorcaoAnos)
      : null;

    if (resultado === null) {
      estudantesForaDoEscopoOuSemDadosParaDistorcao += 1;
    } else {
      estudantesElegiveisDistorcao += 1;
      if (resultado.emDistorcao) estudantesEmDistorcaoIdadeSerie += 1;
    }
  }

  return {
    totalEstudantes,
    escolasAtivas,
    totalTurmas,
    frequenciaMediaRede,
    estudantesAbaixoFaixaFrequencia,
    desempenhoMedioRede: desempenhoAgregado._avg.nota ?? null,
    estudantesEmDistorcaoIdadeSerie,
    estudantesElegiveisDistorcao,
    estudantesForaDoEscopoOuSemDadosParaDistorcao,
  };
}
