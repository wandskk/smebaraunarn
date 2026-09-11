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
   * (Educação Infantil, EJA, Educação Especial, turmas multianuais —
   * nenhuma delas tem uma única idade esperada bem definida) somados aos
   * que têm dado de nascimento ausente ou corrompido. "Trajetória de
   * Sucesso" NÃO está mais nesta lista — é mapeada para uma série regular
   * (ver lib/analytics/mapeamento-serie.ts) e entra no cálculo normalmente.
   * Exposto separadamente para não maquiar o indicador: ver
   * lib/analytics/mapeamento-serie.ts para a lista de casos e
   * centro_indicadores_educacionais.md §19 sobre transparência de dados
   * incompletos.
   */
  estudantesForaDoEscopoOuSemDadosParaDistorcao: number;
}

export async function getIndicadoresGeraisRede(
  parametros: ParametrosIndicadoresGerais,
): Promise<IndicadoresGeraisRede> {
  const { anoLetivo } = parametros;
  const faixasFrequencia = parametros.faixasFrequencia ?? FAIXAS_PADRAO_FREQUENCIA;
  const limiarDistorcaoAnos = parametros.limiarDistorcaoAnos ?? LIMIAR_DISTORCAO_ANOS;

  // `matriculaPorAno` resolve a matrícula histórica de cada aluno (nota do
  // ano, senão snapshot do Estudante só se `Estudante.ano === anoLetivo`) —
  // é a MESMA fonte já usada abaixo para distorção, agora reaproveitada
  // também para população/escolas/turmas. Antes desta correção
  // (ETAPA 01 de docs/indicadores-historico-multianos), esses 3 números
  // vinham de `prisma.estudante.findMany({where:{ano:anoLetivo}})` —
  // `Estudante.ano` é só o snapshot MAIS RECENTE de cada aluno, então um ano
  // histórico contava só quem ainda não migrou de ano/escola desde então
  // (medido: ~65-70% de subcontagem para 2024/2025 no banco de produção).
  const [matriculaPorAno, frequenciaPorEstudante, desempenhoAgregado] = await Promise.all([
    resolverMatriculaPorAno(anoLetivo),
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

  const totalEstudantes = matriculaPorAno.size;
  const escolasAtivas = new Set(
    Array.from(matriculaPorAno.values())
      .map((d) => d.escolaId)
      .filter((id): id is number => id !== null),
  ).size;
  const turmasUnicas = Array.from(
    new Set(Array.from(matriculaPorAno.values()).map((d) => d.turma).filter((t): t is string => Boolean(t))),
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

  // Distorção reaproveita a mesma `matriculaPorAno` resolvida acima — uma
  // única fonte de verdade para "quem estava na rede naquele ano", em vez de
  // duas fontes divergentes (ver comentário no Promise.all acima).
  let estudantesEmDistorcaoIdadeSerie = 0;
  let estudantesForaDoEscopoOuSemDadosParaDistorcao = 0;
  let estudantesElegiveisDistorcao = 0;
  for (const dados of matriculaPorAno.values()) {
    const serie = normalizarSerie(dados.serieTexto);

    const resultado = serie && dados.dataNascimento
      ? calcularDistorcaoIdadeSerie(dados.dataNascimento, serie, anoLetivo, limiarDistorcaoAnos)
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
