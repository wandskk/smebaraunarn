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

export interface FiltroTurmasRede {
  ano: number;
  escolaId?: number;
  serie?: string;
  turno?: string;
}

export interface TurmaRedeResumo {
  escolaId: number;
  nomeEscola: string;
  turma: string;
  serie: string | null;
  turno: string | null;
  totalAlunos: number;
  totalDocentes: number;
  frequenciaPercentual: number | null;
  desempenhoMedia: number | null;
}

/**
 * Visão de rede por turma — o master prompt pede uma rota nova para quando
 * "a pergunta começa por série/turma, não por escola" (hoje as turmas só
 * são acessíveis dentro da ficha da escola). Cada linha abre a mesma ficha
 * de turma já existente (`TurmaDetalheView`); esta função não cria um
 * segundo cálculo de frequência/desempenho — agrega os mesmos dados por
 * turma em vez de por escola, no mesmo espírito de
 * `getFrequenciaPorEscola`/`getDesempenhoPorEscola` (uma consulta agregada
 * cada, não uma consulta por turma).
 *
 * Matrícula da turma usa a atribuição ATUAL do estudante (mesma convenção
 * de `getTurmaDetalhe`), não histórica.
 */
export async function getTurmasRede(filtro: FiltroTurmasRede): Promise<TurmaRedeResumo[]> {
  const janelaAno = { gte: `${filtro.ano}-01-01`, lte: `${filtro.ano}-12-31` };

  const [alunos, escolas, servidorTurmas, somaFrequencia, notasDoAno] = await Promise.all([
    prisma.estudante.findMany({
      where: { turmaSerie: { not: null }, ...(filtro.escolaId ? { escolaId: filtro.escolaId } : {}) },
      select: { matricula: true, escolaId: true, turmaSerie: true },
    }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
    prisma.servidorTurma.findMany({ select: { escolaId: true, turma: true, turno: true, servidorId: true } }),
    prisma.frequenciaEstudante.groupBy({
      by: ["estudanteMatricula"],
      where: { data: janelaAno },
      _sum: { falta: true, quantidadeAula: true },
    }),
    prisma.notaEstudante.findMany({ where: { ano: filtro.ano }, select: { nota: true, turma: true, escola: true } }),
  ]);

  const nomePorEscola = new Map(escolas.map((e) => [e.id, e.nome]));
  const idPorNomeEscola = new Map(escolas.map((e) => [e.nome, e.id]));

  const turmasUnicas = Array.from(new Set(alunos.map((a) => a.turmaSerie as string)));
  const series = await getSeriePorTurma(turmasUnicas);

  interface Acumulado {
    escolaId: number;
    turma: string;
    totalAlunos: number;
    aulas: number;
    faltas: number;
    somaNotas: number;
    totalNotas: number;
  }
  const porTurma = new Map<string, Acumulado>();
  const chave = (escolaId: number, turma: string) => `${escolaId}:${turma}`;

  for (const aluno of alunos) {
    const turma = aluno.turmaSerie as string;
    const k = chave(aluno.escolaId, turma);
    const acc = porTurma.get(k) ?? { escolaId: aluno.escolaId, turma, totalAlunos: 0, aulas: 0, faltas: 0, somaNotas: 0, totalNotas: 0 };
    acc.totalAlunos += 1;
    porTurma.set(k, acc);
  }

  const escolaTurmaPorMatricula = new Map(alunos.map((a) => [a.matricula, { escolaId: a.escolaId, turma: a.turmaSerie as string }]));
  for (const f of somaFrequencia) {
    const local = escolaTurmaPorMatricula.get(f.estudanteMatricula);
    if (!local) continue;
    const acc = porTurma.get(chave(local.escolaId, local.turma));
    if (!acc) continue;
    acc.aulas += f._sum.quantidadeAula ?? 0;
    acc.faltas += f._sum.falta ?? 0;
  }

  for (const n of notasDoAno) {
    if (!n.turma || !n.escola) continue;
    const escolaId = idPorNomeEscola.get(n.escola);
    if (escolaId === undefined) continue; // nome de escola sem correspondência — ver getEscolasNaoMapeadas
    const acc = porTurma.get(chave(escolaId, n.turma));
    if (!acc) continue; // turma sem nenhum aluno atualmente matriculado (ex.: turma extinta) — fora da listagem
    acc.somaNotas += n.nota;
    acc.totalNotas += 1;
  }

  const docentesPorTurma = new Map<string, number>();
  const turnoPorTurma = new Map<string, string>();
  for (const st of servidorTurmas) {
    const k = chave(st.escolaId, st.turma);
    docentesPorTurma.set(k, (docentesPorTurma.get(k) ?? 0) + 1);
    if (st.turno && !turnoPorTurma.has(k)) turnoPorTurma.set(k, st.turno);
  }

  let resultado: TurmaRedeResumo[] = Array.from(porTurma.values()).map((acc) => {
    const k = chave(acc.escolaId, acc.turma);
    return {
      escolaId: acc.escolaId,
      nomeEscola: nomePorEscola.get(acc.escolaId) ?? `Escola ${acc.escolaId}`,
      turma: acc.turma,
      serie: series.get(acc.turma) ?? null,
      turno: turnoPorTurma.get(k) ?? null,
      totalAlunos: acc.totalAlunos,
      totalDocentes: docentesPorTurma.get(k) ?? 0,
      frequenciaPercentual: calcularPercentualFrequencia(acc.aulas, acc.faltas),
      desempenhoMedia: acc.totalNotas > 0 ? acc.somaNotas / acc.totalNotas : null,
    };
  });

  if (filtro.serie) resultado = resultado.filter((t) => t.serie === filtro.serie);
  if (filtro.turno) resultado = resultado.filter((t) => t.turno === filtro.turno);

  return resultado.sort((a, b) => a.nomeEscola.localeCompare(b.nomeEscola) || a.turma.localeCompare(b.turma));
}
