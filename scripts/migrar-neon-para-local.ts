/**
 * Copia todos os dados do Neon (produção) para o banco Postgres local,
 * tabela por tabela, respeitando a ordem de dependência de FK. Usado uma
 * vez para a migração de infraestrutura cloud -> local (ver conversa).
 *
 * Uso: NEON_URL=... LOCAL_URL=... npx tsx scripts/migrar-neon-para-local.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const NEON_URL = process.env.NEON_URL;
const LOCAL_URL = process.env.LOCAL_URL;
if (!NEON_URL || !LOCAL_URL) {
  throw new Error("Defina NEON_URL e LOCAL_URL antes de rodar este script.");
}

const source = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
const target = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });

const CHUNK = 2000;

async function copyTable<T>(
  nome: string,
  fetch: () => Promise<T[]>,
  insertMany: (rows: T[]) => Promise<{ count: number }>,
) {
  const rows = await fetch();
  if (rows.length === 0) {
    console.log(`${nome}: 0 linhas (nada a copiar)`);
    return;
  }
  let copiadas = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const lote = rows.slice(i, i + CHUNK);
    const res = await insertMany(lote);
    copiadas += res.count;
  }
  console.log(`${nome}: ${copiadas}/${rows.length} linhas copiadas`);
}

async function main() {
  await copyTable("Escola", () => source.escola.findMany(), (r) => target.escola.createMany({ data: r }));
  await copyTable("Cargo", () => source.cargo.findMany(), (r) => target.cargo.createMany({ data: r }));
  await copyTable("User", () => source.user.findMany(), (r) => target.user.createMany({ data: r }));
  await copyTable("Servidor", () => source.servidor.findMany(), (r) => target.servidor.createMany({ data: r }));
  await copyTable("ServidorTurma", () => source.servidorTurma.findMany(), (r) => target.servidorTurma.createMany({ data: r }));
  await copyTable("Estudante", () => source.estudante.findMany(), (r) => target.estudante.createMany({ data: r }));
  await copyTable("NotaEstudante", () => source.notaEstudante.findMany(), (r) => target.notaEstudante.createMany({ data: r }));
  await copyTable("FrequenciaEstudante", () => source.frequenciaEstudante.findMany(), (r) => target.frequenciaEstudante.createMany({ data: r }));
  await copyTable("Post", () => source.post.findMany(), (r) => target.post.createMany({ data: r }));
  await copyTable("DocumentoPublico", () => source.documentoPublico.findMany(), (r) => target.documentoPublico.createMany({ data: r }));
  await copyTable("IndicadoresLanding", () => source.indicadoresLanding.findMany(), (r) => target.indicadoresLanding.createMany({ data: r }));
  await copyTable("Avaliacao", () => source.avaliacao.findMany(), (r) => target.avaliacao.createMany({ data: r }));
  await copyTable("AvaliacaoQuestao", () => source.avaliacaoQuestao.findMany(), (r) => target.avaliacaoQuestao.createMany({ data: r }));
  await copyTable("AvaliacaoResultadoAluno", () => source.avaliacaoResultadoAluno.findMany(), (r) => target.avaliacaoResultadoAluno.createMany({ data: r as Prisma.AvaliacaoResultadoAlunoCreateManyInput[] }));
  await copyTable("AvaliacaoResultadoTurma", () => source.avaliacaoResultadoTurma.findMany(), (r) => target.avaliacaoResultadoTurma.createMany({ data: r as Prisma.AvaliacaoResultadoTurmaCreateManyInput[] }));
  await copyTable("LogSincronizacao", () => source.logSincronizacao.findMany(), (r) => target.logSincronizacao.createMany({ data: r }));
}

main()
  .then(async () => {
    await source.$disconnect();
    await target.$disconnect();
    console.log("\nMigração concluída.");
  })
  .catch(async (err) => {
    console.error("ERRO:", err);
    await source.$disconnect();
    await target.$disconnect();
    process.exit(1);
  });
