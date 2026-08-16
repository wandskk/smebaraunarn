import "server-only";

import { prisma } from "@/lib/prisma";
import {
  consultarCargos,
  consultarEscolas,
  consultarEstudantesEnturmados,
  consultarServidores,
} from "@/lib/sigeduc";
import { normalizeBirthDate, normalizeCpf } from "@/lib/utils";

async function logSync(
  modulo: string,
  status: "SUCESSO" | "ERRO",
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

export async function syncServidores() {
  const start = Date.now();
  let total = 0;
  try {
    const escolas = await prisma.escola.findMany();

    for (const escola of escolas) {
      let pagina = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const resposta = await consultarServidores({ idsEscolas: [escola.id] }, pagina, 1000);
        for (const s of resposta.dados) {
          const cpf = normalizeCpf(s.cpf);
          if (!cpf) continue;
          await prisma.servidor.upsert({
            where: { cpf },
            update: {
              nome: s.nome,
              matricula: s.matricula,
              dataNascimento: normalizeBirthDate(s.data_nascimento) ?? s.data_nascimento,
              cargo: s.cargo,
              funcao: s.funo,
              disciplina: s.disciplina,
              escolaId: escola.id,
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
            },
            create: {
              cpf,
              nome: s.nome,
              matricula: s.matricula,
              dataNascimento: normalizeBirthDate(s.data_nascimento) ?? s.data_nascimento,
              cargo: s.cargo,
              funcao: s.funo,
              disciplina: s.disciplina,
              escolaId: escola.id,
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
            },
          });
          total += 1;
        }
        if (!resposta.temProximaPagina) break;
        pagina += 1;
      }
    }

    await logSync("SERVIDORES", "SUCESSO", total, null, Date.now() - start);
    return { count: total };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("SERVIDORES", "ERRO", total, message, Date.now() - start);
    throw error;
  }
}

export async function syncEstudantes(ano: number) {
  const start = Date.now();
  let total = 0;
  try {
    const escolas = await prisma.escola.findMany();

    for (const escola of escolas) {
      let pagina = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const resposta = await consultarEstudantesEnturmados(
          { ano, idEscola: escola.id },
          pagina,
          1000,
        );
        for (const e of resposta.dados) {
          await prisma.estudante.upsert({
            where: { id: e.id },
            update: {
              matricula: e.matricula,
              cpf: e.cpf ? normalizeCpf(e.cpf) : null,
              nome: e.nome,
              dataNascimento: normalizeBirthDate(e.data_nascimento) ?? e.data_nascimento,
              ano,
              turmaSerie: e.nome_turma_serie,
              escolaId: escola.id,
              nomeEscola: e.nomeEscola,
              nomeFiliacao1: e.nome_filiacao_1,
              nomeFiliacao2: e.nome_filiacao_2,
              nomeResponsavel: e.nome_responsavel,
              documentoResponsavel: e.documento_Responsavel,
              codigoNis: e.codigo_Nis,
            },
            create: {
              id: e.id,
              matricula: e.matricula,
              cpf: e.cpf ? normalizeCpf(e.cpf) : null,
              nome: e.nome,
              dataNascimento: normalizeBirthDate(e.data_nascimento) ?? e.data_nascimento,
              ano,
              turmaSerie: e.nome_turma_serie,
              escolaId: escola.id,
              nomeEscola: e.nomeEscola,
              nomeFiliacao1: e.nome_filiacao_1,
              nomeFiliacao2: e.nome_filiacao_2,
              nomeResponsavel: e.nome_responsavel,
              documentoResponsavel: e.documento_Responsavel,
              codigoNis: e.codigo_Nis,
            },
          });
          total += 1;
        }
        if (!resposta.temProximaPagina) break;
        pagina += 1;
      }
    }

    await logSync("ESTUDANTES", "SUCESSO", total, null, Date.now() - start);
    return { count: total };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await logSync("ESTUDANTES", "ERRO", total, message, Date.now() - start);
    throw error;
  }
}
