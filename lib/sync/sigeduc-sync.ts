import "server-only";

import { prisma } from "@/lib/prisma";
import {
  consultarCargos,
  consultarEscolas,
  consultarEstudantesEnturmados,
  consultarServidores,
} from "@/lib/sigeduc";
import { normalizeBirthDate, normalizeCpf } from "@/lib/utils";

/** Margem de segurança para não estourar o timeout da função serverless. */
const DEFAULT_BUDGET_MS = 45_000;

export interface ChunkResult {
  done: boolean;
  nextIndex: number;
  totalEscolas: number;
  registrosNestaExecucao: number;
}

async function logSync(
  modulo: string,
  status: "SUCESSO" | "ERRO" | "PROCESSANDO",
  registros: number,
  mensagem: string | null,
  duracaoMs: number,
) {
  await prisma.logSincronizacao.create({
    data: { modulo, status, registros, mensagem, duracaoMs },
  });
}

export async function syncEscolas() {
  const start = Date.now();
  try {
    const escolas = await consultarEscolas();
    for (const escola of escolas) {
      await prisma.escola.upsert({
        where: { id: escola.id },
        update: { nome: escola.nome, codigoInep: escola.codigo_inep },
        create: { id: escola.id, nome: escola.nome, codigoInep: escola.codigo_inep },
      });
    }
    await logSync("ESCOLAS", "SUCESSO", escolas.length, null, Date.now() - start);
    return { count: escolas.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("ESCOLAS", "ERRO", 0, message, Date.now() - start);
    throw error;
  }
}

export async function syncCargos() {
  const start = Date.now();
  try {
    const cargos = await consultarCargos();
    for (const cargo of cargos) {
      await prisma.cargo.upsert({
        where: { id: cargo.id },
        update: { categoria: cargo.categoria, denominacao: cargo.denominacao, nivelCargo: cargo.nivelCargo },
        create: {
          id: cargo.id,
          categoria: cargo.categoria,
          denominacao: cargo.denominacao,
          nivelCargo: cargo.nivelCargo,
        },
      });
    }
    await logSync("CARGOS", "SUCESSO", cargos.length, null, Date.now() - start);
    return { count: cargos.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("CARGOS", "ERRO", 0, message, Date.now() - start);
    throw error;
  }
}

async function upsertServidor(escolaId: number, s: Awaited<ReturnType<typeof consultarServidores>>["dados"][number]) {
  if (!s.cpf) return false;
  const cpf = normalizeCpf(s.cpf);
  const data = {
    nome: s.nome,
    matricula: s.matricula,
    dataNascimento: normalizeBirthDate(s.data_nascimento) ?? s.data_nascimento,
    cargo: s.cargo,
    funcao: s.funo,
    disciplina: s.disciplina,
    escolaId,
    escolaNome: s.escola,
    pendenciaPedagogica: s.pendencia_pedagogica,
    tipoVinculo: s.tipo_vinculo,
    status: s.status,
    email: s.email,
    telefone: s.telefone,
    cargaTrabalho: s.carga_trabalho,
    turma: s.turma,
    serie: s.serie,
    turno: s.turno,
  };
  await prisma.servidor.upsert({
    where: { cpf },
    update: data,
    create: { cpf, ...data },
  });
  return true;
}

/**
 * Sincroniza servidores em lotes por escola, respeitando um orçamento de
 * tempo (budgetMs) para não estourar o timeout da função serverless.
 * Chame novamente com `startIndex = nextIndex` até `done` ser `true`.
 */
export async function syncServidoresChunk(
  startIndex = 0,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<ChunkResult> {
  const start = Date.now();
  let registros = 0;
  const escolas = await prisma.escola.findMany({ orderBy: { id: "asc" } });

  let index = startIndex;
  try {
    while (index < escolas.length) {
      if (Date.now() - start > budgetMs) break;

      const escola = escolas[index]!;
      let pagina = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const resposta = await consultarServidores({ idsEscolas: [escola.id] }, pagina, 1000);
        for (const s of resposta.dados) {
          if (await upsertServidor(escola.id, s)) registros += 1;
        }
        if (!resposta.temProximaPagina) break;
        pagina += 1;
      }
      index += 1;
    }

    const done = index >= escolas.length;
    await logSync(
      "SERVIDORES",
      done ? "SUCESSO" : "PROCESSANDO",
      registros,
      done ? null : `Lote parcial: escolas ${startIndex + 1}-${index} de ${escolas.length}`,
      Date.now() - start,
    );

    return { done, nextIndex: index, totalEscolas: escolas.length, registrosNestaExecucao: registros };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("SERVIDORES", "ERRO", registros, message, Date.now() - start);
    throw error;
  }
}

async function upsertEstudante(
  ano: number,
  escolaId: number,
  e: Awaited<ReturnType<typeof consultarEstudantesEnturmados>>["dados"][number],
) {
  const data = {
    matricula: e.matricula,
    cpf: e.cpf ? normalizeCpf(e.cpf) : null,
    nome: e.nome,
    dataNascimento: normalizeBirthDate(e.data_nascimento) ?? e.data_nascimento,
    ano,
    turmaSerie: e.nome_turma_serie,
    escolaId,
    nomeEscola: e.nomeEscola,
    nomeFiliacao1: e.nome_filiacao_1,
    nomeFiliacao2: e.nome_filiacao_2,
    nomeResponsavel: e.nome_responsavel,
    documentoResponsavel: e.documento_Responsavel,
    codigoNis: e.codigo_Nis,
  };
  await prisma.estudante.upsert({
    where: { id: e.id },
    update: data,
    create: { id: e.id, ...data },
  });
}

/**
 * Sincroniza estudantes enturmados em lotes por escola, respeitando um
 * orçamento de tempo. Chame novamente com `startIndex = nextIndex` até
 * `done` ser `true`.
 */
export async function syncEstudantesChunk(
  ano: number,
  startIndex = 0,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<ChunkResult> {
  const start = Date.now();
  let registros = 0;
  const escolas = await prisma.escola.findMany({ orderBy: { id: "asc" } });

  let index = startIndex;
  try {
    while (index < escolas.length) {
      if (Date.now() - start > budgetMs) break;

      const escola = escolas[index]!;
      let pagina = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const resposta = await consultarEstudantesEnturmados(
          { ano, idEscola: escola.id },
          pagina,
          1000,
        );
        for (const e of resposta.dados) {
          await upsertEstudante(ano, escola.id, e);
          registros += 1;
        }
        if (!resposta.temProximaPagina) break;
        pagina += 1;
      }
      index += 1;
    }

    const done = index >= escolas.length;
    await logSync(
      "ESTUDANTES",
      done ? "SUCESSO" : "PROCESSANDO",
      registros,
      done ? null : `Lote parcial: escolas ${startIndex + 1}-${index} de ${escolas.length}`,
      Date.now() - start,
    );

    return { done, nextIndex: index, totalEscolas: escolas.length, registrosNestaExecucao: registros };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("ESTUDANTES", "ERRO", registros, message, Date.now() - start);
    throw error;
  }
}
