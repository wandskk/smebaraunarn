import { prisma } from "@/lib/prisma";
import type { NivelFluencia, TipoAvaliacao } from "@prisma/client";

/** Rótulos compartilhados entre Admin e Direção — antes duplicados em cada tela. */
export const TIPO_AVALIACAO_LABEL: Record<TipoAvaliacao, string> = {
  FLUENCIA_LEITORA: "Fluência Leitora",
  SPADEB: "SPADEB",
  SIMULADO: "Simulado",
  PROVA_MUNICIPAL: "Prova Municipal",
};

export const NIVEL_FLUENCIA_LABEL: Record<NivelFluencia, string> = {
  NAO_LEITOR: "Não leitor",
  LEITOR_DE_SILABAS: "Leitor de sílabas",
  LEITOR_DE_PALAVRAS: "Leitor de palavras",
  LEITOR_DE_FRASES: "Leitor de frases",
  LEITOR_SEM_FLUENCIA: "Leitor sem fluência",
  LEITOR_FLUENTE: "Leitor fluente",
};

export interface AvaliacaoResumoEscola {
  avaliacaoId: string;
  codigo: string;
  nome: string;
  tipo: TipoAvaliacao;
  ano: number;
  etapaEnsino: string | null;
  /** Resultados já registrados para a escola nesta avaliação. */
  totalResultados: number;
  /**
   * Matriculados nas turmas da escola que já têm ao menos um resultado
   * nesta avaliação — não o total de estudantes da escola. O modelo
   * `Avaliacao` não guarda turmas/série-alvo (sem tabela de aplicabilidade),
   * então "esperado" só pode ser calculado com segurança dentro das turmas
   * onde a aplicação já teve início; ver nota em `decisões técnicas` na
   * ETAPA 05.
   */
  totalEsperado: number;
  turmasComResultado: number;
  ultimaAtualizacao: Date;
}

export interface AvaliacaoCoberturaTurma {
  turma: string;
  matriculados: number;
  resultados: number;
  /** null quando a turma não tem nenhum matriculado atual (ex.: aluno migrou de turma desde a aplicação). */
  percentual: number | null;
  completa: boolean;
}

export interface AvaliacaoDetalheEscola {
  avaliacaoId: string;
  codigo: string;
  nome: string;
  tipo: TipoAvaliacao;
  ano: number;
  etapaEnsino: string | null;
  cobertura: {
    esperado: number;
    realizado: number;
    percentual: number | null;
    turmasCompletas: number;
    turmasParciais: number;
  };
  porTurma: AvaliacaoCoberturaTurma[];
  turmasDisponiveis: string[];
}

export interface FiltroResultadosAvaliacao {
  turma?: string;
  nivel?: NivelFluencia;
  skip: number;
  take: number;
}

export interface ResultadoAvaliacaoItem {
  id: string;
  estudanteId: number;
  nomeEstudante: string;
  turma: string;
  pontuacao: number | null;
  nivelDesempenho: NivelFluencia | null;
  palavrasPorMin: number | null;
}

/**
 * Uma linha por avaliação aplicada à escola (agrupada pelo id real da
 * avaliação, nunca pelo nome — edições diferentes com nome igual não se
 * misturam), com cobertura estimada a partir das turmas já tocadas pela
 * aplicação. Substitui a antiga tela de "últimos 100 resultados" (regra
 * P0 do documento de Diretor: nunca truncar silenciosamente).
 */
export async function getAvaliacoesResumoPorEscola(escolaId: number): Promise<AvaliacaoResumoEscola[]> {
  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { escolaId },
    select: { avaliacaoId: true, turma: true, updatedAt: true },
  });
  if (resultados.length === 0) return [];

  const avaliacaoIds = Array.from(new Set(resultados.map((r) => r.avaliacaoId)));
  const turmas = Array.from(new Set(resultados.map((r) => r.turma)));

  const [avaliacoes, matriculasPorTurma] = await Promise.all([
    prisma.avaliacao.findMany({ where: { id: { in: avaliacaoIds } } }),
    prisma.estudante.groupBy({
      by: ["turmaSerie"],
      where: { escolaId, turmaSerie: { in: turmas } },
      _count: { _all: true },
    }),
  ]);

  const matriculadosPorTurma = new Map(matriculasPorTurma.map((m) => [m.turmaSerie as string, m._count._all]));
  const avaliacaoPorId = new Map(avaliacoes.map((a) => [a.id, a]));

  const porAvaliacao = new Map<string, typeof resultados>();
  for (const r of resultados) {
    if (!porAvaliacao.has(r.avaliacaoId)) porAvaliacao.set(r.avaliacaoId, []);
    porAvaliacao.get(r.avaliacaoId)!.push(r);
  }

  const resumos: AvaliacaoResumoEscola[] = [];
  for (const [avaliacaoId, itens] of porAvaliacao) {
    const avaliacao = avaliacaoPorId.get(avaliacaoId);
    if (!avaliacao) continue; // avaliação excluída após os resultados; não deve aparecer no catálogo

    const turmasDaAvaliacao = Array.from(new Set(itens.map((i) => i.turma)));
    const totalEsperado = turmasDaAvaliacao.reduce((soma, t) => soma + (matriculadosPorTurma.get(t) ?? 0), 0);
    const ultimaAtualizacao = itens.reduce(
      (max, i) => (i.updatedAt > max ? i.updatedAt : max),
      itens[0]!.updatedAt,
    );

    resumos.push({
      avaliacaoId,
      codigo: avaliacao.codigo,
      nome: avaliacao.nome,
      tipo: avaliacao.tipo,
      ano: avaliacao.ano,
      etapaEnsino: avaliacao.etapaEnsino,
      totalResultados: itens.length,
      totalEsperado,
      turmasComResultado: turmasDaAvaliacao.length,
      ultimaAtualizacao,
    });
  }

  return resumos.sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome));
}

/**
 * Cobertura por turma + lista paginada de resultados de uma avaliação
 * específica na escola. `avaliacao` retorna `null` quando não há nenhum
 * resultado dessa avaliação nesta escola (evita vazar avaliações de outras
 * escolas por manipulação de URL).
 */
export async function getAvaliacaoDetalhePorEscola(
  avaliacaoId: string,
  escolaId: number,
  filtro: FiltroResultadosAvaliacao,
): Promise<{ avaliacao: AvaliacaoDetalheEscola; itens: ResultadoAvaliacaoItem[]; total: number } | null> {
  const [avaliacao, todosResultados] = await Promise.all([
    prisma.avaliacao.findUnique({ where: { id: avaliacaoId } }),
    prisma.avaliacaoResultadoAluno.findMany({
      where: { avaliacaoId, escolaId },
      select: { turma: true },
    }),
  ]);

  if (!avaliacao || todosResultados.length === 0) return null;

  const turmasDisponiveis = Array.from(new Set(todosResultados.map((r) => r.turma))).sort();
  const matriculasPorTurma = await prisma.estudante.groupBy({
    by: ["turmaSerie"],
    where: { escolaId, turmaSerie: { in: turmasDisponiveis } },
    _count: { _all: true },
  });
  const matriculadosPorTurma = new Map(matriculasPorTurma.map((m) => [m.turmaSerie as string, m._count._all]));

  const resultadosPorTurma = new Map<string, number>();
  for (const r of todosResultados) resultadosPorTurma.set(r.turma, (resultadosPorTurma.get(r.turma) ?? 0) + 1);

  const porTurma: AvaliacaoCoberturaTurma[] = turmasDisponiveis.map((turma) => {
    const matriculados = matriculadosPorTurma.get(turma) ?? 0;
    const resultadosDaTurma = resultadosPorTurma.get(turma) ?? 0;
    return {
      turma,
      matriculados,
      resultados: resultadosDaTurma,
      percentual: matriculados > 0 ? (resultadosDaTurma / matriculados) * 100 : null,
      completa: matriculados > 0 && resultadosDaTurma >= matriculados,
    };
  });

  const esperado = porTurma.reduce((soma, t) => soma + t.matriculados, 0);
  const realizado = todosResultados.length;

  const where = {
    avaliacaoId,
    escolaId,
    ...(filtro.turma ? { turma: filtro.turma } : {}),
    ...(filtro.nivel ? { nivelDesempenho: filtro.nivel } : {}),
  };

  const [resultadosPagina, total] = await Promise.all([
    prisma.avaliacaoResultadoAluno.findMany({
      where,
      include: { estudante: { select: { nome: true } } },
      orderBy: [{ turma: "asc" }, { estudante: { nome: "asc" } }],
      skip: filtro.skip,
      take: filtro.take,
    }),
    prisma.avaliacaoResultadoAluno.count({ where }),
  ]);

  return {
    avaliacao: {
      avaliacaoId: avaliacao.id,
      codigo: avaliacao.codigo,
      nome: avaliacao.nome,
      tipo: avaliacao.tipo,
      ano: avaliacao.ano,
      etapaEnsino: avaliacao.etapaEnsino,
      cobertura: {
        esperado,
        realizado,
        percentual: esperado > 0 ? (realizado / esperado) * 100 : null,
        turmasCompletas: porTurma.filter((t) => t.completa).length,
        turmasParciais: porTurma.filter((t) => !t.completa).length,
      },
      porTurma,
      turmasDisponiveis,
    },
    itens: resultadosPagina.map((r) => ({
      id: r.id,
      estudanteId: r.estudanteId,
      nomeEstudante: r.estudante.nome,
      turma: r.turma,
      pontuacao: r.pontuacao,
      nivelDesempenho: r.nivelDesempenho,
      palavrasPorMin: r.palavrasPorMin,
    })),
    total,
  };
}
