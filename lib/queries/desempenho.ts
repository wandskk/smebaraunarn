import { prisma } from "@/lib/prisma";
import {
  calcularMediana,
  calcularPercentil,
  calcularAmplitude,
  calcularProporcaoAbaixoDe,
  calcularHistograma,
  type BucketHistograma,
} from "@/lib/analytics/estatistica";
import type { PontoEvolucaoAnual } from "@/lib/analytics/frequencia";

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

/**
 * Faixas de agrupamento visual do histograma de notas (seção 10 do plano
 * MVP) — só para mostrar concentração/dispersão, não uma classificação
 * pedagógica de aluno.
 */
export const FAIXAS_HISTOGRAMA_NOTAS_PADRAO = [
  { min: 0, max: 2, label: "0–2" },
  { min: 2, max: 4, label: "2–4" },
  { min: 4, max: 6, label: "4–6" },
  { min: 6, max: 8, label: "6–8" },
  { min: 8, max: 10, label: "8–10" },
];

/**
 * Distribuição de notas da rede em faixas (histograma) — mesmo recorte
 * (ano/disciplina/unidade) de `getDesempenhoPorEscola`, mas sem quebrar por
 * escola. Busca os valores brutos separadamente (não reaproveita
 * `getDesempenhoPorEscola`) porque aquela função só expõe estatísticas já
 * agregadas por escola, não os valores individuais que o histograma
 * precisa — mesmo filtro, então o custo é o mesmo `findMany` já
 * considerado barato no volume atual da rede (ver nota em
 * `getDesempenhoPorEscola`).
 */
export async function getDistribuicaoNotasRede(filtro: FiltroDesempenhoPorEscola): Promise<BucketHistograma[]> {
  const notas = await prisma.notaEstudante.findMany({
    where: {
      ano: filtro.anoLetivo,
      ...(filtro.disciplina ? { disciplina: filtro.disciplina } : {}),
      ...(filtro.unidade ? { unidade: filtro.unidade } : {}),
    },
    select: { nota: true },
  });

  return calcularHistograma(
    notas.map((n) => n.nota),
    FAIXAS_HISTOGRAMA_NOTAS_PADRAO,
  );
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

export type { PontoEvolucaoAnual };

export interface FiltroEvolucaoDesempenho {
  /** Sem filtro, calcula sobre todas as disciplinas. */
  disciplina?: string;
  /** Bimestre (1-4). */
  unidade?: number;
  /** Escopo por escola (Portal da Direção ou detalhe de escola). */
  escolaId?: number;
}

/**
 * Evolução da média de notas lançadas ano a ano (rede ou escopada por escola).
 *
 * Agrega as notas diretamente no PostgreSQL via 1 único `groupBy` por `ano` com
 * `_avg: { nota: true }`, sem N+1. Preserva a ordem cronológica (ascendente).
 */
export async function getEvolucaoDesempenhoPorAno(
  anos: number[],
  filtro?: FiltroEvolucaoDesempenho,
): Promise<PontoEvolucaoAnual[]> {
  if (anos.length === 0) return [];
  const anosOrdenados = Array.from(new Set(anos)).sort((a, b) => a - b);

  let whereEscola: { OR: ({ escola: string | null } | { escola: null; estudante: { escolaId: number } })[] } | undefined;
  if (filtro?.escolaId !== undefined) {
    const escola = await prisma.escola.findUnique({ where: { id: filtro.escolaId }, select: { nome: true } });
    const nomeEscola = escola?.nome ?? null;
    whereEscola = {
      OR: [{ escola: nomeEscola }, { escola: null, estudante: { escolaId: filtro.escolaId } }],
    };
  }

  const linhas = await prisma.notaEstudante.groupBy({
    by: ["ano"],
    where: {
      ano: { in: anosOrdenados },
      ...(filtro?.disciplina ? { disciplina: filtro.disciplina } : {}),
      ...(filtro?.unidade ? { unidade: filtro.unidade } : {}),
      ...(whereEscola ? whereEscola : {}),
    },
    _avg: { nota: true },
  });

  return mapearEvolucaoDesempenho(
    anosOrdenados,
    linhas.map((l) => ({ ano: l.ano, media: l._avg.nota ?? null })),
  );
}

/**
 * Transforma linhas agregadas de notas em pontos de evolução ordenados cronologicamente,
 * preenchendo anos sem dados com `valor: null` — parte pura/testável da query.
 */
export function mapearEvolucaoDesempenho(
  anos: number[],
  linhasAgrupadas: { ano: number; media: number | null }[],
): PontoEvolucaoAnual[] {
  const anosOrdenados = Array.from(new Set(anos)).sort((a, b) => a - b);
  const mediaPorAno = new Map<number, number | null>();
  for (const l of linhasAgrupadas) {
    mediaPorAno.set(l.ano, l.media);
  }

  return anosOrdenados.map((ano) => ({
    ano,
    valor: mediaPorAno.get(ano) ?? null,
  }));
}


