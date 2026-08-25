import { prisma } from "@/lib/prisma";
import type { NivelFluencia, TipoAvaliacao } from "@prisma/client";
import {
  deriveStatusAvaliacao,
  calcularAnalisePorItem,
  calcularDistribuicaoFluencia,
  type StatusAvaliacao,
  type AnaliseItemResultado,
  type AnaliseDescritorResultado,
  type DistribuicaoFluencia,
} from "@/lib/analytics/avaliacoes";

export { STATUS_AVALIACAO_LABEL, type StatusAvaliacao } from "@/lib/analytics/avaliacoes";

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

/**
 * Escopo de visibilidade das avaliações — mesmo espírito de `lib/authz/Scope`,
 * mas restrito ao que as consultas deste módulo precisam (sem depender de
 * lib/authz para não acoplar autorização a leitura de dados). `professor`
 * usa a tupla (escolaId, turma) de `ServidorTurma`, não só o código da
 * turma — necessário porque códigos de turma se repetem entre escolas
 * (ETAPA 06).
 */
export type AvaliacaoScope =
  | { kind: "rede" }
  | { kind: "escola"; escolaId: number }
  | { kind: "professor"; atribuicoes: { escolaId: number; turma: string }[] };

export interface AvaliacaoResumoEscola {
  avaliacaoId: string;
  codigo: string;
  nome: string;
  tipo: TipoAvaliacao;
  ano: number;
  etapaEnsino: string | null;
  /** Resultados já registrados neste escopo para a avaliação. */
  totalResultados: number;
  /**
   * Matriculados nas turmas (deste escopo) que já têm ao menos um resultado
   * nesta avaliação — não o total de estudantes do escopo. O modelo
   * `Avaliacao` não guarda turmas/série-alvo (sem tabela de aplicabilidade),
   * então "esperado" só pode ser calculado com segurança dentro das turmas
   * onde a aplicação já teve início; ver nota em `decisões técnicas` na
   * ETAPA 05.
   */
  totalEsperado: number;
  turmasComResultado: number;
  ultimaAtualizacao: Date;
  status: StatusAvaliacao;
}

export interface AvaliacaoCoberturaTurma {
  escolaId: number;
  turma: string;
  matriculados: number;
  resultados: number;
  /** null quando a turma não tem nenhum matriculado atual (ex.: aluno migrou de turma desde a aplicação). */
  percentual: number | null;
  completa: boolean;
}

export interface EscolaPendenteAvaliacao {
  id: number;
  nome: string;
}

export interface AvaliacaoDetalheEscola {
  avaliacaoId: string;
  codigo: string;
  nome: string;
  tipo: TipoAvaliacao;
  ano: number;
  etapaEnsino: string | null;
  status: StatusAvaliacao;
  cobertura: {
    esperado: number;
    realizado: number;
    percentual: number | null;
    turmasCompletas: number;
    turmasParciais: number;
  };
  porTurma: AvaliacaoCoberturaTurma[];
  turmasDisponiveis: string[];
  /**
   * Só preenchido no escopo rede (Admin) — escolas da rede sem nenhum
   * resultado registrado nesta avaliação ainda. `null` nos demais escopos
   * (Direção/Professor não têm visão de outras escolas).
   */
  escolasPendentes: EscolaPendenteAvaliacao[] | null;
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
  escolaId: number;
  turma: string;
  pontuacao: number | null;
  nivelDesempenho: NivelFluencia | null;
  palavrasPorMin: number | null;
}

export interface ResultadoAvaliacaoAluno {
  id: string;
  avaliacaoId: string;
  nome: string;
  codigo: string;
  tipo: TipoAvaliacao;
  ano: number;
  etapaEnsino: string | null;
  pontuacao: number | null;
  nivelDesempenho: NivelFluencia | null;
  palavrasPorMin: number | null;
  observacoes: string | null;
  atualizadoEm: Date;
}

function whereResultadoPorScope(scope: AvaliacaoScope) {
  switch (scope.kind) {
    case "rede":
      return {};
    case "escola":
      return { escolaId: scope.escolaId };
    case "professor":
      return { OR: scope.atribuicoes.map((a) => ({ escolaId: a.escolaId, turma: a.turma })) };
  }
}

/** Chave estável para desambiguar turma+escola — códigos de turma se repetem entre escolas (ETAPA 06/00). */
function chaveTurma(escolaId: number, turma: string): string {
  return `${escolaId}:${turma}`;
}

async function contarMatriculadosPorTurma(chaves: { escolaId: number; turma: string }[]): Promise<Map<string, number>> {
  if (chaves.length === 0) return new Map();
  const grupos = await prisma.estudante.groupBy({
    by: ["escolaId", "turmaSerie"],
    where: { OR: chaves.map((c) => ({ escolaId: c.escolaId, turmaSerie: c.turma })) },
    _count: { _all: true },
  });
  return new Map(grupos.map((g) => [chaveTurma(g.escolaId, g.turmaSerie as string), g._count._all]));
}

interface ResultadoScopeRow {
  escolaId: number;
  turma: string;
}

/**
 * Agrega cobertura (esperado/realizado/turmas completas x parciais) a partir
 * de linhas de resultado já filtradas por avaliação+escopo. Extraído para
 * ser reaproveitado tanto pelo resumo por avaliação (`getAvaliacoesResumo`)
 * quanto pela cobertura em lote do catálogo (`getCoberturaResumoPorAvaliacoes`)
 * — mesma fórmula, sem duplicar o loop de turmas.
 */
function agregarCobertura(itens: ResultadoScopeRow[], matriculadosPorTurma: Map<string, number>) {
  const turmasDaAvaliacao = Array.from(new Set(itens.map((i) => chaveTurma(i.escolaId, i.turma))));
  let esperado = 0;
  let turmasCompletas = 0;
  let turmasParciais = 0;
  for (const chave of turmasDaAvaliacao) {
    const matriculados = matriculadosPorTurma.get(chave) ?? 0;
    const resultadosDaTurma = itens.filter((i) => chaveTurma(i.escolaId, i.turma) === chave).length;
    esperado += matriculados;
    if (matriculados > 0 && resultadosDaTurma >= matriculados) turmasCompletas++;
    else turmasParciais++;
  }
  return { esperado, realizado: itens.length, turmasComResultado: turmasDaAvaliacao.length, turmasCompletas, turmasParciais };
}

/**
 * Resultados de avaliações municipais do PRÓPRIO estudante — usado pelo
 * portal do Aluno (ETAPA 07). Nunca inclui dado de outro estudante nem
 * posição/ranking na turma; é só a leitura pessoal do mesmo
 * `AvaliacaoResultadoAluno` que Admin/Diretor já usam com escopo mais amplo.
 */
export async function getAvaliacoesResultadosPorEstudante(estudanteId: number): Promise<ResultadoAvaliacaoAluno[]> {
  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { estudanteId },
    include: { avaliacao: true },
    orderBy: [{ avaliacao: { ano: "desc" } }, { updatedAt: "desc" }],
  });

  return resultados.map((r) => ({
    id: r.id,
    avaliacaoId: r.avaliacaoId,
    nome: r.avaliacao.nome,
    codigo: r.avaliacao.codigo,
    tipo: r.avaliacao.tipo,
    ano: r.avaliacao.ano,
    etapaEnsino: r.avaliacao.etapaEnsino,
    pontuacao: r.pontuacao,
    nivelDesempenho: r.nivelDesempenho,
    palavrasPorMin: r.palavrasPorMin,
    observacoes: r.observacoes,
    atualizadoEm: r.updatedAt,
  }));
}

/**
 * Uma linha por avaliação aplicada dentro do escopo (agrupada pelo id real
 * da avaliação, nunca pelo nome — edições diferentes com nome igual não se
 * misturam), com cobertura estimada a partir das turmas já tocadas pela
 * aplicação. Motor único reaproveitado por Admin (rede), Direção (escola) e
 * Professor (turmas atribuídas) — evita reescrever a mesma fórmula 3x.
 */
export async function getAvaliacoesResumo(scope: AvaliacaoScope): Promise<AvaliacaoResumoEscola[]> {
  if (scope.kind === "professor" && scope.atribuicoes.length === 0) return [];

  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: whereResultadoPorScope(scope),
    select: { avaliacaoId: true, escolaId: true, turma: true, updatedAt: true },
  });
  if (resultados.length === 0) return [];

  const avaliacaoIds = Array.from(new Set(resultados.map((r) => r.avaliacaoId)));
  const chavesTurma = Array.from(new Set(resultados.map((r) => chaveTurma(r.escolaId, r.turma)))).map((k) => {
    const [escolaId, turma] = k.split(":");
    return { escolaId: Number(escolaId), turma: turma! };
  });

  const [avaliacoes, matriculadosPorTurma] = await Promise.all([
    prisma.avaliacao.findMany({ where: { id: { in: avaliacaoIds } } }),
    contarMatriculadosPorTurma(chavesTurma),
  ]);

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

    const agregado = agregarCobertura(itens, matriculadosPorTurma);
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
      totalResultados: agregado.realizado,
      totalEsperado: agregado.esperado,
      turmasComResultado: agregado.turmasComResultado,
      ultimaAtualizacao,
      status: deriveStatusAvaliacao(agregado),
    });
  }

  return resumos.sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome));
}

/** @deprecated use `getAvaliacoesResumo({ kind: "escola", escolaId })` */
export async function getAvaliacoesResumoPorEscola(escolaId: number): Promise<AvaliacaoResumoEscola[]> {
  return getAvaliacoesResumo({ kind: "escola", escolaId });
}

export interface CoberturaResumo {
  esperado: number;
  realizado: number;
  percentual: number | null;
  status: StatusAvaliacao;
}

/**
 * Cobertura rede-inteira (todas as escolas) para um conjunto específico de
 * avaliações — usado pelo catálogo do Admin, que já pagina `Avaliacao` no
 * banco; calcular cobertura só para os ids da página atual evita escanear
 * `AvaliacaoResultadoAluno` inteiro a cada visita.
 */
export async function getCoberturaResumoPorAvaliacoes(avaliacaoIds: string[]): Promise<Map<string, CoberturaResumo>> {
  if (avaliacaoIds.length === 0) return new Map();

  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { avaliacaoId: { in: avaliacaoIds } },
    select: { avaliacaoId: true, escolaId: true, turma: true },
  });
  if (resultados.length === 0) return new Map();

  const chavesTurma = Array.from(new Set(resultados.map((r) => chaveTurma(r.escolaId, r.turma)))).map((k) => {
    const [escolaId, turma] = k.split(":");
    return { escolaId: Number(escolaId), turma: turma! };
  });
  const matriculadosPorTurma = await contarMatriculadosPorTurma(chavesTurma);

  const porAvaliacao = new Map<string, typeof resultados>();
  for (const r of resultados) {
    if (!porAvaliacao.has(r.avaliacaoId)) porAvaliacao.set(r.avaliacaoId, []);
    porAvaliacao.get(r.avaliacaoId)!.push(r);
  }

  const mapa = new Map<string, CoberturaResumo>();
  for (const [avaliacaoId, itens] of porAvaliacao) {
    const agregado = agregarCobertura(itens, matriculadosPorTurma);
    mapa.set(avaliacaoId, {
      esperado: agregado.esperado,
      realizado: agregado.realizado,
      percentual: agregado.esperado > 0 ? (agregado.realizado / agregado.esperado) * 100 : null,
      status: deriveStatusAvaliacao(agregado),
    });
  }
  return mapa;
}

/**
 * Cobertura por turma + lista paginada de resultados de uma avaliação
 * dentro do escopo. Motor único reaproveitado por Admin/Direção/Professor.
 *
 * No escopo rede (Admin), sempre retorna a avaliação quando ela existe —
 * mesmo com zero resultados ainda (o Admin gerencia a avaliação antes dela
 * ter dados). Nos escopos escola/professor, retorna `null` quando não há
 * nenhum resultado relevante ao escopo — evita expor a página de uma
 * avaliação que não toca a escola/turma do usuário.
 */
export async function getAvaliacaoDetalhe(
  avaliacaoId: string,
  scope: AvaliacaoScope,
  filtro: FiltroResultadosAvaliacao,
): Promise<{ avaliacao: AvaliacaoDetalheEscola; itens: ResultadoAvaliacaoItem[]; total: number } | null> {
  if (scope.kind === "professor" && scope.atribuicoes.length === 0) return null;

  const [avaliacao, todosResultados] = await Promise.all([
    prisma.avaliacao.findUnique({ where: { id: avaliacaoId } }),
    prisma.avaliacaoResultadoAluno.findMany({
      where: { avaliacaoId, ...whereResultadoPorScope(scope) },
      select: { escolaId: true, turma: true },
    }),
  ]);

  if (!avaliacao) return null;
  if (scope.kind !== "rede" && todosResultados.length === 0) return null;

  const chavesTurma = Array.from(new Set(todosResultados.map((r) => chaveTurma(r.escolaId, r.turma)))).map((k) => {
    const [escolaId, turma] = k.split(":");
    return { escolaId: Number(escolaId), turma: turma! };
  });
  const turmasDisponiveis = Array.from(new Set(todosResultados.map((r) => r.turma))).sort();
  const matriculadosPorTurma = await contarMatriculadosPorTurma(chavesTurma);

  const resultadosPorTurma = new Map<string, number>();
  for (const r of todosResultados) {
    const chave = chaveTurma(r.escolaId, r.turma);
    resultadosPorTurma.set(chave, (resultadosPorTurma.get(chave) ?? 0) + 1);
  }

  const porTurma: AvaliacaoCoberturaTurma[] = chavesTurma.map(({ escolaId, turma }) => {
    const chave = chaveTurma(escolaId, turma);
    const matriculados = matriculadosPorTurma.get(chave) ?? 0;
    const resultadosDaTurma = resultadosPorTurma.get(chave) ?? 0;
    return {
      escolaId,
      turma,
      matriculados,
      resultados: resultadosDaTurma,
      percentual: matriculados > 0 ? (resultadosDaTurma / matriculados) * 100 : null,
      completa: matriculados > 0 && resultadosDaTurma >= matriculados,
    };
  });

  const esperado = porTurma.reduce((soma, t) => soma + t.matriculados, 0);
  const realizado = todosResultados.length;
  const turmasCompletas = porTurma.filter((t) => t.completa).length;
  const turmasParciais = porTurma.filter((t) => !t.completa).length;

  let escolasPendentes: EscolaPendenteAvaliacao[] | null = null;
  if (scope.kind === "rede") {
    const escolasComResultado = new Set(todosResultados.map((r) => r.escolaId));
    escolasPendentes = await prisma.escola.findMany({
      where: { id: { notIn: Array.from(escolasComResultado) } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }

  const where = {
    avaliacaoId,
    ...whereResultadoPorScope(scope),
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
      status: deriveStatusAvaliacao({ esperado, realizado, turmasCompletas, turmasParciais }),
      cobertura: {
        esperado,
        realizado,
        percentual: esperado > 0 ? (realizado / esperado) * 100 : null,
        turmasCompletas,
        turmasParciais,
      },
      porTurma,
      turmasDisponiveis,
      escolasPendentes,
    },
    itens: resultadosPagina.map((r) => ({
      id: r.id,
      estudanteId: r.estudanteId,
      nomeEstudante: r.estudante.nome,
      escolaId: r.escolaId,
      turma: r.turma,
      pontuacao: r.pontuacao,
      nivelDesempenho: r.nivelDesempenho,
      palavrasPorMin: r.palavrasPorMin,
    })),
    total,
  };
}

/** @deprecated use `getAvaliacaoDetalhe(avaliacaoId, { kind: "escola", escolaId }, filtro)` */
export async function getAvaliacaoDetalhePorEscola(
  avaliacaoId: string,
  escolaId: number,
  filtro: FiltroResultadosAvaliacao,
) {
  return getAvaliacaoDetalhe(avaliacaoId, { kind: "escola", escolaId }, filtro);
}

/**
 * % de acerto por questão/descritor a partir de `respostasJson` + gabarito —
 * independente da paginação de `getAvaliacaoDetalhe` (precisa de TODOS os
 * resultados do escopo, não só a página atual). Retorna `null` quando a
 * avaliação não existe.
 */
export async function getAnaliseItensAvaliacao(
  avaliacaoId: string,
  scope: AvaliacaoScope,
): Promise<{ porQuestao: AnaliseItemResultado[]; porDescritor: AnaliseDescritorResultado[]; totalRespondentes: number } | null> {
  if (scope.kind === "professor" && scope.atribuicoes.length === 0) return null;

  const [questoes, resultados] = await Promise.all([
    prisma.avaliacaoQuestao.findMany({ where: { avaliacaoId }, select: { numero: true, descritor: true, gabaritoCorreto: true } }),
    prisma.avaliacaoResultadoAluno.findMany({
      where: { avaliacaoId, ...whereResultadoPorScope(scope) },
      select: { respostasJson: true },
    }),
  ]);

  if (questoes.length === 0) return null;

  const respostas = resultados.map((r) => ({ respostasJson: r.respostasJson as Record<string, string> | null }));
  const { porQuestao, porDescritor } = calcularAnalisePorItem(questoes, respostas);

  return { porQuestao, porDescritor, totalRespondentes: resultados.length };
}

/**
 * Distribuição de resultados de Fluência Leitora por nível + estatísticas
 * de palavras/minuto, agregado (nunca lista de estudante) — usa TODOS os
 * resultados do escopo, não a página atual de `getAvaliacaoDetalhe`.
 */
export async function getDistribuicaoFluencia(avaliacaoId: string, scope: AvaliacaoScope): Promise<DistribuicaoFluencia | null> {
  if (scope.kind === "professor" && scope.atribuicoes.length === 0) return null;

  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { avaliacaoId, ...whereResultadoPorScope(scope) },
    select: { nivelDesempenho: true, palavrasPorMin: true },
  });

  return calcularDistribuicaoFluencia(resultados, Object.keys(NIVEL_FLUENCIA_LABEL));
}
