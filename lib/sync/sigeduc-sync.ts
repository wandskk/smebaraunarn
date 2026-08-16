import "server-only";

import { prisma } from "@/lib/prisma";
import {
  consultarCargos,
  consultarEscolas,
  consultarEstudantesEnturmados,
  consultarFrequencia,
  consultarNotas,
  consultarServidores,
} from "@/lib/sigeduc";
import { classifyServidorRole } from "@/lib/roles";
import { normalizeBirthDate, normalizeCpf, normalizeCpfLoose } from "@/lib/utils";

/** Margem de segurança para não estourar o timeout da função serverless. */
const DEFAULT_BUDGET_MS = 45_000;

export interface ChunkResult {
  done: boolean;
  nextIndex: number;
  totalEscolas: number;
  registrosNestaExecucao: number;
}

export interface PageChunkResult {
  done: boolean;
  nextPagina: number;
  totalPaginas: number;
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

export interface ServidorChunkResult extends PageChunkResult {
  /** Repasse este valor nas próximas chamadas da mesma sincronização. */
  syncStartedAt: string;
}

/**
 * Sincroniza servidores em lotes de páginas, respeitando um orçamento de
 * tempo (budgetMs) para não estourar o timeout da função serverless.
 * Chame novamente com `startPagina = nextPagina` e o mesmo `syncStartedAt`
 * retornado na chamada anterior, até `done` ser `true`.
 *
 * Importante: /consulta-servidor é paginada por (servidor × turma), sem
 * filtro de escola — cargos de direção/coordenação (DIRETOR, VICE DIRETOR,
 * COORDENADOR...) aparecem vinculados à "SME - Secretaria Municipal de
 * Educação", não a uma escola física, então filtrar por idsEscolas os
 * deixava de fora inteiramente. Aqui resolvemos escolaId a partir do
 * codigo_inep_escola retornado, e deixamos null quando não há
 * correspondência (ex.: cargos lotados na Secretaria).
 *
 * Um mesmo servidor aparece em uma linha por turma; cada turma vira uma
 * linha em ServidorTurma (upsert por servidorId+turma). Ao final de uma
 * sincronização completa (`done === true`), remove turmas não tocadas
 * desde `syncStartedAt` — ou seja, turmas que o servidor tinha antes mas
 * que não vieram mais nesta rodada (mudou de turma/saiu da escola).
 */
export async function syncServidoresChunk(
  startPagina = 0,
  budgetMs = DEFAULT_BUDGET_MS,
  syncStartedAt: string = new Date().toISOString(),
): Promise<ServidorChunkResult> {
  const start = Date.now();
  let registros = 0;
  let pagina = startPagina;
  let totalPaginas = startPagina + 1;
  let done = false;

  const escolasPorInep = new Map(
    (await prisma.escola.findMany({ select: { id: true, codigoInep: true } }))
      .filter((e) => e.codigoInep)
      .map((e) => [e.codigoInep, e.id]),
  );

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - start > budgetMs) break;

      const resposta = await consultarServidores({}, pagina, 500);
      totalPaginas = resposta.totalPaginas;

      for (const s of resposta.dados) {
        if (!s.cpf) continue;
        const cpf = normalizeCpf(s.cpf);
        const escolaId = s.codigo_inep_escola ? (escolasPorInep.get(s.codigo_inep_escola) ?? null) : null;
        const data = {
          nome: s.nome,
          matricula: s.matricula,
          dataNascimento: normalizeBirthDate(s.data_nascimento) ?? s.data_nascimento,
          cargo: s.cargo,
          funcao: s.funo,
          escolaNome: s.escola,
          pendenciaPedagogica: s.pendencia_pedagogica,
          tipoVinculo: s.tipo_vinculo,
          status: s.status,
          email: s.email,
          telefone: s.telefone,
        };
        // Cargos de direção/coordenação vêm sem escola na origem (lotados na
        // Secretaria) — a atribuição em /admin/servidores é a única fonte
        // para eles. Sem este desvio, todo sync apagava esse vínculo manual
        // de volta para null. Para os demais cargos, a origem continua
        // mandando: se um servidor de fato perde a escola lá, refletimos.
        const preservarEscolaManual = escolaId === null && classifyServidorRole(s.cargo, s.funo) === "DIRETOR";
        const servidor = await prisma.servidor.upsert({
          where: { cpf },
          update: preservarEscolaManual ? data : { ...data, escolaId },
          create: { cpf, ...data, escolaId },
        });

        if (s.turma) {
          const turmaData = {
            serie: s.serie,
            turno: s.turno,
            disciplina: s.disciplina,
            cargaTrabalho: s.carga_trabalho,
          };
          await prisma.servidorTurma.upsert({
            where: { servidorId_turma: { servidorId: servidor.id, turma: s.turma } },
            update: turmaData,
            create: { servidorId: servidor.id, turma: s.turma, ...turmaData },
          });
        }

        registros += 1;
      }

      pagina += 1;
      if (!resposta.temProximaPagina) {
        done = true;
        break;
      }
    }

    if (done) {
      await prisma.servidorTurma.deleteMany({
        where: { updatedAt: { lt: new Date(syncStartedAt) } },
      });
    }

    await logSync(
      "SERVIDORES",
      done ? "SUCESSO" : "PROCESSANDO",
      registros,
      done ? null : `Lote parcial: páginas ${startPagina + 1}-${pagina} de ${totalPaginas}`,
      Date.now() - start,
    );

    return { done, nextPagina: pagina, totalPaginas, registrosNestaExecucao: registros, syncStartedAt };
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
    documentoResponsavel: normalizeCpfLoose(e.documento_Responsavel),
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

/**
 * `consulta-nota` é paginada por aluno (não por nota), então cada página
 * inteira pertence a um conjunto fechado de matrículas — é seguro apagar e
 * recriar as notas desse ano só para essas matrículas a cada página,
 * evitando duplicar registros a cada re-sincronização.
 */
export async function syncNotasChunk(
  ano: number,
  startPagina = 0,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<PageChunkResult> {
  const start = Date.now();
  let registros = 0;
  let pagina = startPagina;
  let totalPaginas = startPagina + 1;
  let done = false;

  const estudantesValidos = new Set(
    (await prisma.estudante.findMany({ select: { matricula: true } })).map((e) => e.matricula),
  );

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - start > budgetMs) break;

      const resposta = await consultarNotas(ano, pagina, 300);
      totalPaginas = resposta.totalPaginas;

      const alunosValidos = resposta.dados.filter((aluno) => estudantesValidos.has(aluno.matricula));
      const matriculas = alunosValidos.map((aluno) => aluno.matricula);

      if (matriculas.length > 0) {
        await prisma.notaEstudante.deleteMany({
          where: { estudanteMatricula: { in: matriculas }, ano },
        });

        const rows = alunosValidos.flatMap((aluno) =>
          aluno.turmas_componentes.flatMap((tc) =>
            tc.notas.map((n) => ({
              estudanteMatricula: aluno.matricula,
              ano,
              escola: tc.escola,
              etapaEnsino: tc.etapa_ensino,
              serie: tc.serie,
              turma: tc.turma,
              disciplina: tc.disciplina,
              unidade: n.unidade,
              nota: n.nota,
              descricao: n.descricao,
            })),
          ),
        );

        if (rows.length > 0) {
          await prisma.notaEstudante.createMany({ data: rows, skipDuplicates: true });
          registros += rows.length;
        }
      }

      pagina += 1;
      if (!resposta.temProximaPagina) {
        done = true;
        break;
      }
    }

    await logSync(
      "NOTAS",
      done ? "SUCESSO" : "PROCESSANDO",
      registros,
      done ? null : `Lote parcial: páginas ${startPagina + 1}-${pagina} de ${totalPaginas} (ano ${ano})`,
      Date.now() - start,
    );

    return { done, nextPagina: pagina, totalPaginas, registrosNestaExecucao: registros };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("NOTAS", "ERRO", registros, message, Date.now() - start);
    throw error;
  }
}

/**
 * `consulta-frequencia` também é paginada por aluno. O apaga-e-recria é
 * restrito à janela [dataInicio, dataFim] sendo sincronizada, para não
 * apagar frequência de outras janelas já sincronizadas anteriormente.
 */
export async function syncFrequenciaChunk(
  dataInicio: string,
  dataFim: string,
  startPagina = 0,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<PageChunkResult> {
  const start = Date.now();
  let registros = 0;
  let pagina = startPagina;
  let totalPaginas = startPagina + 1;
  let done = false;

  const estudantesValidos = new Set(
    (await prisma.estudante.findMany({ select: { matricula: true } })).map((e) => e.matricula),
  );

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - start > budgetMs) break;

      const resposta = await consultarFrequencia(dataInicio, dataFim, pagina, 300);
      totalPaginas = resposta.totalPaginas;

      const alunosValidos = resposta.dados.filter((aluno) => estudantesValidos.has(aluno.matricula));
      const matriculas = alunosValidos.map((aluno) => aluno.matricula);

      if (matriculas.length > 0) {
        await prisma.frequenciaEstudante.deleteMany({
          where: {
            estudanteMatricula: { in: matriculas },
            data: { gte: dataInicio, lte: dataFim },
          },
        });

        const rows = alunosValidos.flatMap((aluno) =>
          aluno.frequencias.map((f) => ({
            estudanteMatricula: aluno.matricula,
            data: f.data,
            disciplina: f.disciplina,
            turma: f.turma,
            etapaEnsino: f.etapa_ensino,
            falta: f.falta,
            quantidadeAula: f.quantidade_aula,
            abonada: f.abonada,
            motivoAbono: f.motivo_abono || null,
          })),
        );

        if (rows.length > 0) {
          await prisma.frequenciaEstudante.createMany({ data: rows, skipDuplicates: true });
          registros += rows.length;
        }
      }

      pagina += 1;
      if (!resposta.temProximaPagina) {
        done = true;
        break;
      }
    }

    await logSync(
      "FREQUENCIA",
      done ? "SUCESSO" : "PROCESSANDO",
      registros,
      done
        ? null
        : `Lote parcial: páginas ${startPagina + 1}-${pagina} de ${totalPaginas} (${dataInicio} a ${dataFim})`,
      Date.now() - start,
    );

    return { done, nextPagina: pagina, totalPaginas, registrosNestaExecucao: registros };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("FREQUENCIA", "ERRO", registros, message, Date.now() - start);
    throw error;
  }
}
