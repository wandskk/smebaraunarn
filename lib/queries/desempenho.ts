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
}

export interface DesempenhoEscola {
  escolaId: number;
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
 */
export async function getDesempenhoPorEscola(filtro: FiltroDesempenhoPorEscola): Promise<DesempenhoEscola[]> {
  const notaMinimaEsperada = filtro.notaMinimaEsperada ?? NOTA_MINIMA_ESPERADA_PADRAO;

  const [estudantes, escolas, notas] = await Promise.all([
    prisma.estudante.findMany({ where: { ano: filtro.anoLetivo }, select: { matricula: true, escolaId: true } }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
    prisma.notaEstudante.findMany({
      where: { ano: filtro.anoLetivo },
      select: { nota: true, estudanteMatricula: true },
    }),
  ]);

  const escolaPorMatricula = new Map(estudantes.map((e) => [e.matricula, e.escolaId]));
  const nomePorEscola = new Map(escolas.map((e) => [e.id, e.nome]));

  const notasPorEscola = new Map<number, number[]>();
  for (const nota of notas) {
    const escolaId = escolaPorMatricula.get(nota.estudanteMatricula);
    if (escolaId === undefined) continue;
    const lista = notasPorEscola.get(escolaId) ?? [];
    lista.push(nota.nota);
    notasPorEscola.set(escolaId, lista);
  }

  const resultado: DesempenhoEscola[] = [];
  for (const [escolaId, valores] of notasPorEscola) {
    const soma = valores.reduce((acc, v) => acc + v, 0);
    resultado.push({
      escolaId,
      nomeEscola: nomePorEscola.get(escolaId) ?? `Escola #${escolaId}`,
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
