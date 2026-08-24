import { prisma } from "@/lib/prisma";
import {
  calcularMediana,
  calcularPercentil,
  calcularAmplitude,
  calcularProporcaoAbaixoDe,
} from "@/lib/analytics/estatistica";

/**
 * Nota mínima considerada "esperada" — padrão comum de aprovação em redes
 * municipais brasileiras (média 6,0). Ainda não confirmada oficialmente
 * pela Secretaria para este município (ver docs/PLANO_DESENVOLVIMENTO.md
 * §8) — por isso é parâmetro com valor default, não uma constante fixa
 * usada sem possibilidade de ajuste.
 */
export const NOTA_MINIMA_ESPERADA_PADRAO = 6;

export interface FiltroDesempenhoPorEscola {
  anoLetivo: number;
  notaMinimaEsperada?: number;
  /** Sem filtro, mistura todas as disciplinas — útil para visão geral, mas esconde diferença entre componentes. */
  disciplina?: string;
  /** Bimestre (1-4, ver TOTAL_UNIDADES_ANO em components/portal/grade-table.tsx). */
  unidade?: number;
}

export interface DesempenhoEscola {
  /** Null quando o nome de escola do registro de nota não bate com nenhuma Escola sincronizada. */
  escolaId: number | null;
  nomeEscola: string;
  totalNotasLancadas: number;
  media: number | null;
  mediana: number | null;
  percentil25: number | null;
  percentil75: number | null;
  amplitude: number | null;
  percentualAbaixoDoEsperado: number | null;
}

/**
 * Distribuição de notas por escola — não só a média (ver
 * centro_indicadores_educacionais.md §8: "duas escolas podem apresentar
 * média 7,0 e realidades completamente diferentes"). Busca as notas
 * individuais em memória para calcular mediana/percentis porque o SQL do
 * Prisma não expõe percentil nativamente; no volume atual da rede
 * (~29 mil notas/ano) isso é barato — se crescer muito, revisar.
 *
 * A escola de cada nota vem do próprio registro (`NotaEstudante.escola`),
 * não de `Estudante.escolaId` — este último guarda só a matrícula vigente
 * do aluno, então usá-lo aqui atribuiria notas de anos anteriores à escola
 * atual do aluno sempre que ele tiver trocado de escola desde então.
 */
export async function getDesempenhoPorEscola(filtro: FiltroDesempenhoPorEscola): Promise<DesempenhoEscola[]> {
  const notaMinimaEsperada = filtro.notaMinimaEsperada ?? NOTA_MINIMA_ESPERADA_PADRAO;

  const [notas, escolas] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: {
        ano: filtro.anoLetivo,
        ...(filtro.disciplina ? { disciplina: filtro.disciplina } : {}),
        ...(filtro.unidade ? { unidade: filtro.unidade } : {}),
      },
      select: { nota: true, escola: true },
    }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
  ]);
  const idPorNomeEscola = new Map(escolas.map((e) => [e.nome, e.id]));

  const notasPorEscola = new Map<string, number[]>();
  for (const registro of notas) {
    const nomeEscola = registro.escola ?? "Escola não identificada";
    const lista = notasPorEscola.get(nomeEscola) ?? [];
    lista.push(registro.nota);
    notasPorEscola.set(nomeEscola, lista);
  }

  const resultado: DesempenhoEscola[] = [];
  for (const [nomeEscola, valores] of notasPorEscola) {
    const soma = valores.reduce((acc, v) => acc + v, 0);
    resultado.push({
      escolaId: idPorNomeEscola.get(nomeEscola) ?? null,
      nomeEscola,
      totalNotasLancadas: valores.length,
      media: valores.length > 0 ? soma / valores.length : null,
      mediana: calcularMediana(valores),
      percentil25: calcularPercentil(valores, 25),
      percentil75: calcularPercentil(valores, 75),
      amplitude: calcularAmplitude(valores),
      percentualAbaixoDoEsperado: calcularProporcaoAbaixoDe(valores, notaMinimaEsperada),
    });
  }

  return resultado.sort((a, b) => (a.media ?? 10) - (b.media ?? 10));
}

/** Disciplinas com nota lançada no ano — alimenta o filtro de `/admin/indicadores/aprendizagem`, sem inventar uma lista fixa. */
export async function getDisciplinasComNota(anoLetivo: number): Promise<string[]> {
  const linhas = await prisma.notaEstudante.findMany({
    where: { ano: anoLetivo },
    distinct: ["disciplina"],
    select: { disciplina: true },
    orderBy: { disciplina: "asc" },
  });
  return linhas.map((l) => l.disciplina);
}
