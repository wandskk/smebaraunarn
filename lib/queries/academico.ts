import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcularJanelaDias, calcularPercentualFrequencia, type JanelaDias } from "@/lib/analytics/frequencia";

/** Janela padrão de frequência exibida na ficha do estudante — ver ETAPA 02. */
export const DIAS_FREQUENCIA_FICHA_ALUNO = 90;

export interface TurmaResumo {
  turma: string;
  serie: string | null;
  totalAlunos: number;
}

/**
 * A origem não dá um nome legível de turma pro aluno — só o código interno
 * (ex.: "EFAFM6A"). Notas e atribuições de professor carregam um campo
 * "série" (ex.: "6º Ano"), mas ele é o mesmo pras 4 turmas A/B/C/D de uma
 * série — não dá pra usar sozinho como nome, só como complemento do
 * código. FrequenciaEstudante não tem esse campo. Busca a série em
 * NotaEstudante primeiro (é onde mais turmas têm registro), caindo para
 * ServidorTurma quando a turma ainda não tem nota lançada.
 */
export async function getSeriePorTurma(turmas: string[]): Promise<Map<string, string>> {
  const series = new Map<string, string>();
  if (turmas.length === 0) return series;

  const [notas, servidorTurmas] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { turma: { in: turmas } },
      distinct: ["turma"],
      select: { turma: true, serie: true },
    }),
    prisma.servidorTurma.findMany({
      where: { turma: { in: turmas } },
      distinct: ["turma"],
      select: { turma: true, serie: true },
    }),
  ]);

  // Ordem de prioridade: quem vier depois só preenche o que ainda falta.
  for (const fonte of [notas, servidorTurmas]) {
    for (const item of fonte) {
      if (item.turma && item.serie && !series.has(item.turma)) series.set(item.turma, item.serie);
    }
  }

  return series;
}

/**
 * Combina a série com a letra da seção (ex.: "6º Ano" + "EFAFM6A" -> "6º Ano
 * A"), pra diferenciar turmas que compartilham a mesma série (A/B/C/D...).
 * A origem não dá essa letra como campo separado — é inferida do último
 * caractere do código, que segue esse padrão na esmagadora maioria dos
 * casos observados. Turmas multianuais (código termina em "-M<dígito>", ex.
 * "MULTIINTM1A5A-M3") não seguem esse padrão; nesses casos cai para a série
 * sozinha em vez de arriscar uma letra errada.
 */
export function formatTurmaLabel(serie: string | null, turma: string): string {
  if (!serie) return turma;
  const letra = /^[A-Z]$/.test(turma.slice(-1)) && !/-M\d$/.test(turma) ? turma.slice(-1) : null;
  return letra ? `${serie} ${letra}` : serie;
}

/** Lista as turmas de uma escola (a partir dos alunos enturmados), com contagem. */
export async function getTurmasDaEscola(escolaId: number): Promise<TurmaResumo[]> {
  const grupos = await prisma.estudante.groupBy({
    by: ["turmaSerie"],
    where: { escolaId },
    _count: { _all: true },
    orderBy: { turmaSerie: "asc" },
  });

  const turmas = grupos.filter((g) => g.turmaSerie).map((g) => g.turmaSerie as string);
  const series = await getSeriePorTurma(turmas);

  return grupos
    .filter((g) => g.turmaSerie)
    .map((g) => ({
      turma: g.turmaSerie as string,
      serie: series.get(g.turmaSerie as string) ?? null,
      totalAlunos: g._count._all,
    }));
}

export interface TurmaDetalhe {
  turma: string;
  serie: string | null;
  alunos: Awaited<ReturnType<typeof prisma.estudante.findMany>>;
  notasPorDisciplina: { disciplina: string; media: number; quantidade: number }[];
  frequencia: { totalAulas: number; totalFaltas: number; percentual: number | null };
}

/**
 * Alunos, médias por disciplina e frequência agregada de uma turma
 * específica — notas e frequência usam o mesmo recorte de ano (`ano-01-01`
 * a `ano-12-31`), para não combinar frequência de todo o histórico com
 * notas de um único ano letivo (achado do master prompt, ETAPA 04: "notas
 * usam ano atual; frequência é agregada sem o mesmo recorte").
 */
export async function getTurmaDetalhe(escolaId: number, turma: string, ano: number): Promise<TurmaDetalhe> {
  const [alunos, notasAgregadas, frequenciaAgregada, series] = await Promise.all([
    prisma.estudante.findMany({ where: { escolaId, turmaSerie: turma }, orderBy: { nome: "asc" } }),
    prisma.notaEstudante.groupBy({
      by: ["disciplina"],
      where: { turma, ano, estudante: { escolaId } },
      _avg: { nota: true },
      _count: { _all: true },
      orderBy: { disciplina: "asc" },
    }),
    prisma.frequenciaEstudante.aggregate({
      where: { turma, estudante: { escolaId }, data: { gte: `${ano}-01-01`, lte: `${ano}-12-31` } },
      _sum: { falta: true, quantidadeAula: true },
    }),
    getSeriePorTurma([turma]),
  ]);

  const totalAulas = frequenciaAgregada._sum.quantidadeAula ?? 0;
  const totalFaltas = frequenciaAgregada._sum.falta ?? 0;

  return {
    turma,
    serie: series.get(turma) ?? null,
    alunos,
    notasPorDisciplina: notasAgregadas.map((n) => ({
      disciplina: n.disciplina,
      media: n._avg.nota ?? 0,
      quantidade: n._count._all,
    })),
    frequencia: {
      totalAulas,
      totalFaltas,
      percentual: calcularPercentualFrequencia(totalAulas, totalFaltas),
    },
  };
}

export interface AlunoDetalheCompleto {
  estudante: Prisma.EstudanteGetPayload<{ include: { escola: true } }>;
  notas: Awaited<ReturnType<typeof prisma.notaEstudante.findMany>>;
  frequencias: Awaited<ReturnType<typeof prisma.frequenciaEstudante.findMany>>;
  /** Janela de calendário (não "N registros") usada para buscar `frequencias` acima. */
  janelaFrequencia: JanelaDias;
}

/**
 * Ficha completa de um aluno: dados, boletim do ano corrente e frequência
 * dos últimos `DIAS_FREQUENCIA_FICHA_ALUNO` dias corridos — um período de
 * calendário real, não "os 90 registros mais recentes" (que antes podia
 * cobrir semanas ou meses dependendo da regularidade de lançamento da
 * escola de origem — achado do master prompt, ETAPA 02).
 */
export async function getAlunoDetalheCompleto(
  alunoId: number,
  ano: number,
  referencia: Date = new Date(),
): Promise<AlunoDetalheCompleto | null> {
  const estudante = await prisma.estudante.findUnique({ where: { id: alunoId }, include: { escola: true } });
  if (!estudante) return null;

  const janelaFrequencia = calcularJanelaDias(referencia, DIAS_FREQUENCIA_FICHA_ALUNO);

  const [notas, frequencias] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, ano },
      orderBy: [{ disciplina: "asc" }, { unidade: "asc" }],
    }),
    prisma.frequenciaEstudante.findMany({
      where: {
        estudanteMatricula: estudante.matricula,
        data: { gte: janelaFrequencia.inicio, lte: janelaFrequencia.fim },
      },
      orderBy: { data: "desc" },
    }),
  ]);

  return { estudante, notas, frequencias, janelaFrequencia };
}
