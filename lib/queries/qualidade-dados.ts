import { prisma } from "@/lib/prisma";
import {
  classificarSituacaoSincronizacao,
  execucaoIncompleta,
  possuiDivergenciaDeSerie,
} from "@/lib/analytics/qualidade-dados";

/** Módulos disparados pelos crons diários (`vercel.json`) e pelo painel de sincronização manual. */
export const MODULOS_SINCRONIZACAO = ["ESCOLAS", "CARGOS", "SERVIDORES", "ESTUDANTES", "NOTAS", "FREQUENCIA"] as const;

/** Rótulo amigável de cada módulo — compartilhado entre qualquer tela que liste saúde de sincronização. */
export const ROTULO_MODULO: Record<(typeof MODULOS_SINCRONIZACAO)[number], string> = {
  ESCOLAS: "Escolas",
  CARGOS: "Cargos",
  SERVIDORES: "Servidores",
  ESTUDANTES: "Estudantes",
  NOTAS: "Notas",
  FREQUENCIA: "Frequência",
};

/**
 * Versão segura de `ROTULO_MODULO` para `modulo` vindo de texto livre (ex.:
 * `LogSincronizacao.modulo` no histórico bruto) — cai para o próprio nome
 * do módulo se não for um dos conhecidos, em vez de erro de tipo.
 */
export function rotuloModulo(modulo: string): string {
  return (ROTULO_MODULO as Record<string, string>)[modulo] ?? modulo;
}

export interface StatusModuloSincronizacao {
  modulo: (typeof MODULOS_SINCRONIZACAO)[number];
  ultimoLog: {
    status: string;
    createdAt: Date;
    registros: number;
    duracaoMs: number | null;
    mensagem: string | null;
  } | null;
  ultimoSucessoEm: Date | null;
  errosUltimos7Dias: number;
  situacao: ReturnType<typeof classificarSituacaoSincronizacao>;
  /** `true` quando o log mais recente ficou "PROCESSANDO" tempo demais — indício de execução travada/abandonada. */
  execucaoIncompleta: boolean;
}

export interface HistoricoSincronizacaoItem {
  id: string;
  modulo: string;
  status: string;
  registros: number;
  duracaoMs: number | null;
  mensagem: string | null;
  createdAt: Date;
}

/** Saúde de cada módulo de sincronização + histórico recente, para o painel de qualidade de dados. */
export async function getStatusSincronizacao(): Promise<{
  modulos: StatusModuloSincronizacao[];
  historico: HistoricoSincronizacaoItem[];
}> {
  const agora = new Date();
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [ultimosLogs, ultimosSucessos, errosRecentes, historico] = await Promise.all([
    Promise.all(
      MODULOS_SINCRONIZACAO.map((modulo) =>
        prisma.logSincronizacao.findFirst({ where: { modulo }, orderBy: { createdAt: "desc" } }),
      ),
    ),
    Promise.all(
      MODULOS_SINCRONIZACAO.map((modulo) =>
        prisma.logSincronizacao.findFirst({ where: { modulo, status: "SUCESSO" }, orderBy: { createdAt: "desc" } }),
      ),
    ),
    prisma.logSincronizacao.groupBy({
      by: ["modulo"],
      where: { status: "ERRO", createdAt: { gte: seteDiasAtras } },
      _count: { _all: true },
    }),
    prisma.logSincronizacao.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const errosPorModulo = new Map(errosRecentes.map((e) => [e.modulo, e._count._all]));

  const modulos: StatusModuloSincronizacao[] = MODULOS_SINCRONIZACAO.map((modulo, i) => {
    const ultimoLog = ultimosLogs[i];
    const ultimoSucesso = ultimosSucessos[i];
    return {
      modulo,
      ultimoLog: ultimoLog
        ? {
            status: ultimoLog.status,
            createdAt: ultimoLog.createdAt,
            registros: ultimoLog.registros,
            duracaoMs: ultimoLog.duracaoMs,
            mensagem: ultimoLog.mensagem,
          }
        : null,
      ultimoSucessoEm: ultimoSucesso?.createdAt ?? null,
      errosUltimos7Dias: errosPorModulo.get(modulo) ?? 0,
      situacao: classificarSituacaoSincronizacao(ultimoSucesso?.createdAt ?? null, agora),
      execucaoIncompleta: execucaoIncompleta(
        ultimoLog ? { status: ultimoLog.status, createdAt: ultimoLog.createdAt } : null,
        agora,
      ),
    };
  });

  return { modulos, historico };
}

export interface ColisaoCodigoTurma {
  turma: string;
  divergente: boolean;
  escolas: { escolaId: number; nomeEscola: string; series: string[] }[];
}

/**
 * Códigos de turma reutilizados por mais de uma escola (a origem SIGEduc não
 * garante unicidade global do código). Sinaliza como divergente só quando as
 * escolas colidentes atribuem séries diferentes ao mesmo código — o cenário
 * onde o indicador de distorção idade-série poderia usar a série errada (ver
 * docs/PLANO_DESENVOLVIMENTO.md §8 item 6 e lib/queries/academico.ts).
 */
export async function getColisoesCodigoTurma(): Promise<ColisaoCodigoTurma[]> {
  const gruposEstudante = await prisma.estudante.groupBy({
    by: ["turmaSerie", "escolaId"],
    where: { turmaSerie: { not: null } },
  });

  const escolasPorTurma = new Map<string, Set<number>>();
  for (const grupo of gruposEstudante) {
    const turma = grupo.turmaSerie as string;
    if (!escolasPorTurma.has(turma)) escolasPorTurma.set(turma, new Set());
    escolasPorTurma.get(turma)!.add(grupo.escolaId);
  }

  const turmasColidentes = Array.from(escolasPorTurma.entries())
    .filter(([, escolas]) => escolas.size > 1)
    .map(([turma]) => turma);

  if (turmasColidentes.length === 0) return [];

  const [notas, servidorTurmas, escolas] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { turma: { in: turmasColidentes } },
      select: { turma: true, serie: true, estudante: { select: { escolaId: true } } },
    }),
    prisma.servidorTurma.findMany({
      where: { turma: { in: turmasColidentes } },
      select: { turma: true, serie: true, servidor: { select: { escolaId: true } } },
    }),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
  ]);

  const nomeEscolaPorId = new Map(escolas.map((e) => [e.id, e.nome]));

  // turma -> escolaId -> conjunto de séries observadas (pode ter mais de uma fonte divergindo)
  const seriesPorTurmaEscola = new Map<string, Map<number, Set<string>>>();
  for (const turma of turmasColidentes) seriesPorTurmaEscola.set(turma, new Map());

  for (const nota of notas) {
    if (!nota.turma || !nota.serie || !nota.estudante) continue;
    const porEscola = seriesPorTurmaEscola.get(nota.turma);
    if (!porEscola) continue;
    const escolaId = nota.estudante.escolaId;
    if (!porEscola.has(escolaId)) porEscola.set(escolaId, new Set());
    porEscola.get(escolaId)!.add(nota.serie);
  }

  for (const st of servidorTurmas) {
    if (!st.turma || !st.serie || !st.servidor?.escolaId) continue;
    const porEscola = seriesPorTurmaEscola.get(st.turma);
    if (!porEscola) continue;
    const escolaId = st.servidor.escolaId;
    if (!porEscola.has(escolaId)) porEscola.set(escolaId, new Set());
    porEscola.get(escolaId)!.add(st.serie);
  }

  return turmasColidentes
    .map((turma) => {
      const escolasIds = Array.from(escolasPorTurma.get(turma) ?? []);
      const porEscola = seriesPorTurmaEscola.get(turma) ?? new Map<number, Set<string>>();

      const escolasInfo = escolasIds.map((escolaId) => ({
        escolaId,
        nomeEscola: nomeEscolaPorId.get(escolaId) ?? `Escola ${escolaId}`,
        series: Array.from(porEscola.get(escolaId) ?? []),
      }));

      const todasAsSeries: (string | null)[] = escolasInfo.flatMap((e) => (e.series.length > 0 ? e.series : [null]));

      return { turma, divergente: possuiDivergenciaDeSerie(todasAsSeries), escolas: escolasInfo };
    })
    .sort((a, b) => Number(b.divergente) - Number(a.divergente) || a.turma.localeCompare(b.turma));
}

export interface ChecagemCompletude {
  campo: string;
  impacto: string;
  ausentes: number;
  total: number;
  /** null quando `total` é 0 — não dá pra calcular percentual de nada. */
  percentualAusente: number | null;
}

/**
 * Completude por campo — responde "esse número que estou vendo é confiável?"
 * em vez de só "a sincronização rodou?" (a saúde de sincronização acima já
 * cobre isso). Cada checagem usa `count()` diretamente no banco, não
 * `findMany` + filtro em memória — mesmo em anos com muitos registros, o
 * custo de cada checagem é um único `COUNT`.
 */
export async function getCompletudeDados(): Promise<ChecagemCompletude[]> {
  const [
    totalEstudantes,
    estudantesSemNascimento,
    estudantesSemCpf,
    totalServidores,
    servidoresSemEscola,
    totalNotas,
    notasSemEscola,
    notasSemSerie,
    totalFrequencias,
    frequenciasSemEscola,
  ] = await Promise.all([
    prisma.estudante.count(),
    prisma.estudante.count({ where: { dataNascimento: null } }),
    prisma.estudante.count({ where: { cpf: null } }),
    prisma.servidor.count(),
    prisma.servidor.count({ where: { escolaId: null } }),
    prisma.notaEstudante.count(),
    prisma.notaEstudante.count({ where: { escola: null } }),
    prisma.notaEstudante.count({ where: { serie: null } }),
    prisma.frequenciaEstudante.count(),
    prisma.frequenciaEstudante.count({ where: { escola: null } }),
  ]);

  const pct = (ausentes: number, total: number) => (total > 0 ? (ausentes / total) * 100 : null);

  return [
    {
      campo: "Estudantes sem data de nascimento",
      impacto: "Impede o cálculo de distorção idade-série para esses estudantes.",
      ausentes: estudantesSemNascimento,
      total: totalEstudantes,
      percentualAusente: pct(estudantesSemNascimento, totalEstudantes),
    },
    {
      campo: "Estudantes sem CPF",
      impacto: "Impede login do Aluno/responsável por CPF e busca de resultado de avaliação por CPF.",
      ausentes: estudantesSemCpf,
      total: totalEstudantes,
      percentualAusente: pct(estudantesSemCpf, totalEstudantes),
    },
    {
      campo: "Servidores sem escola vinculada",
      impacto: "Servidor não aparece em nenhuma ficha de escola/turma; se tiver usuário provisionado, o portal não terá contexto de escola.",
      ausentes: servidoresSemEscola,
      total: totalServidores,
      percentualAusente: pct(servidoresSemEscola, totalServidores),
    },
    {
      campo: "Notas sem escola no registro",
      impacto: "Essas notas não entram em nenhum indicador por escola (Aprendizagem, Comparativos) — só na média geral da rede.",
      ausentes: notasSemEscola,
      total: totalNotas,
      percentualAusente: pct(notasSemEscola, totalNotas),
    },
    {
      campo: "Notas sem série no registro",
      impacto: "Essas notas não contribuem para a resolução de série da turma (usada pela distorção idade-série).",
      ausentes: notasSemSerie,
      total: totalNotas,
      percentualAusente: pct(notasSemSerie, totalNotas),
    },
    {
      campo: "Frequência sem escola no registro",
      impacto: "Esses registros de frequência não entram no indicador de frequência por escola — só afetam a ficha individual do estudante.",
      ausentes: frequenciasSemEscola,
      total: totalFrequencias,
      percentualAusente: pct(frequenciasSemEscola, totalFrequencias),
    },
  ];
}

export interface EscolaNaoMapeada {
  nome: string;
  origem: "notas" | "frequencia";
}

/**
 * Nomes de escola (texto livre em `NotaEstudante.escola`/`FrequenciaEstudante.escola`)
 * que não correspondem a nenhuma `Escola` sincronizada — cada um representa
 * um grupo de registros invisível aos indicadores por escola (ver checagens
 * acima). Conta nomes distintos, não linhas — o volume de linhas já está
 * coberto por `getCompletudeDados` via outra dimensão (ausência, não
 * divergência).
 */
export async function getEscolasNaoMapeadas(): Promise<EscolaNaoMapeada[]> {
  const [nomesNotas, nomesFrequencia, escolas] = await Promise.all([
    prisma.notaEstudante.findMany({ where: { escola: { not: null } }, distinct: ["escola"], select: { escola: true } }),
    prisma.frequenciaEstudante.findMany({ where: { escola: { not: null } }, distinct: ["escola"], select: { escola: true } }),
    prisma.escola.findMany({ select: { nome: true } }),
  ]);

  const nomesEscolas = new Set(escolas.map((e) => e.nome));
  const resultado: EscolaNaoMapeada[] = [];
  for (const n of nomesNotas) {
    if (n.escola && !nomesEscolas.has(n.escola)) resultado.push({ nome: n.escola, origem: "notas" });
  }
  for (const n of nomesFrequencia) {
    if (n.escola && !nomesEscolas.has(n.escola)) resultado.push({ nome: n.escola, origem: "frequencia" });
  }
  return resultado.sort((a, b) => a.nome.localeCompare(b.nome));
}
