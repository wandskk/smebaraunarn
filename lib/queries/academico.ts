import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface TurmaResumo {
  turma: string;
  totalAlunos: number;
}

/** Lista as turmas de uma escola (a partir dos alunos enturmados), com contagem. */
export async function getTurmasDaEscola(escolaId: number): Promise<TurmaResumo[]> {
  const grupos = await prisma.estudante.groupBy({
    by: ["turmaSerie"],
    where: { escolaId },
    _count: { _all: true },
    orderBy: { turmaSerie: "asc" },
  });

  return grupos
    .filter((g) => g.turmaSerie)
    .map((g) => ({ turma: g.turmaSerie as string, totalAlunos: g._count._all }));
}

export interface TurmaDetalhe {
  turma: string;
  alunos: Awaited<ReturnType<typeof prisma.estudante.findMany>>;
  notasPorDisciplina: { disciplina: string; media: number; quantidade: number }[];
  frequencia: { totalAulas: number; totalFaltas: number; percentual: number | null };
}

/** Alunos, médias por disciplina e frequência agregada de uma turma específica. */
export async function getTurmaDetalhe(escolaId: number, turma: string, ano: number): Promise<TurmaDetalhe> {
  const [alunos, notasAgregadas, frequenciaAgregada] = await Promise.all([
    prisma.estudante.findMany({ where: { escolaId, turmaSerie: turma }, orderBy: { nome: "asc" } }),
    prisma.notaEstudante.groupBy({
      by: ["disciplina"],
      where: { turma, ano, estudante: { escolaId } },
      _avg: { nota: true },
      _count: { _all: true },
      orderBy: { disciplina: "asc" },
    }),
    prisma.frequenciaEstudante.aggregate({
      where: { turma, estudante: { escolaId } },
      _sum: { falta: true, quantidadeAula: true },
    }),
  ]);

  const totalAulas = frequenciaAgregada._sum.quantidadeAula ?? 0;
  const totalFaltas = frequenciaAgregada._sum.falta ?? 0;

  return {
    turma,
    alunos,
    notasPorDisciplina: notasAgregadas.map((n) => ({
      disciplina: n.disciplina,
      media: n._avg.nota ?? 0,
      quantidade: n._count._all,
    })),
    frequencia: {
      totalAulas,
      totalFaltas,
      percentual: totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null,
    },
  };
}

export interface AlunoDetalheCompleto {
  estudante: Prisma.EstudanteGetPayload<{ include: { escola: true } }>;
  notas: Awaited<ReturnType<typeof prisma.notaEstudante.findMany>>;
  frequencias: Awaited<ReturnType<typeof prisma.frequenciaEstudante.findMany>>;
}

/** Ficha completa de um aluno: dados, boletim do ano corrente e frequência recente. */
export async function getAlunoDetalheCompleto(
  alunoId: number,
  ano: number,
): Promise<AlunoDetalheCompleto | null> {
  const estudante = await prisma.estudante.findUnique({ where: { id: alunoId }, include: { escola: true } });
  if (!estudante) return null;

  const [notas, frequencias] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, ano },
      orderBy: [{ disciplina: "asc" }, { unidade: "asc" }],
    }),
    prisma.frequenciaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula },
      orderBy: { data: "desc" },
      take: 90,
    }),
  ]);

  return { estudante, notas, frequencias };
}
