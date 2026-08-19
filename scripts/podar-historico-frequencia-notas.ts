/**
 * Poda dados históricos (anos != ano corrente) de FrequenciaEstudante e
 * NotaEstudante pra liberar espaço no banco (Neon, limite de 512 MB —
 * ver LogSincronizacao, erro Postgres 53100). Dado que pode ser
 * re-sincronizado do SIGEduc depois via scripts/sync-historico.ts, se o
 * plano for upgradado.
 *
 * Não mexe em Estudante (pequena, não é o problema de espaço).
 *
 * Uso: npx tsx scripts/podar-historico-frequencia-notas.ts --manter=2026
 */
import { PrismaClient } from "@prisma/client";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];
  const manter = Number(get("manter")) || new Date().getFullYear();
  return { manter };
}

async function main() {
  const { manter } = parseArgs();
  const prisma = new PrismaClient();

  console.log(`=== Podando histórico, mantendo apenas ano ${manter} ===\n`);

  const freqAntes = await prisma.frequenciaEstudante.count();
  const notasAntes = await prisma.notaEstudante.count();
  console.log(`Antes: FrequenciaEstudante=${freqAntes} · NotaEstudante=${notasAntes}`);

  const freqDeletadas = await prisma.$executeRawUnsafe(
    `DELETE FROM "FrequenciaEstudante" WHERE LEFT(data, 4) != $1`,
    String(manter),
  );
  console.log(`FrequenciaEstudante: ${freqDeletadas} linhas removidas`);

  const notasDeletadas = await prisma.$executeRawUnsafe(
    `DELETE FROM "NotaEstudante" WHERE ano != $1`,
    manter,
  );
  console.log(`NotaEstudante: ${notasDeletadas} linhas removidas`);

  const freqDepois = await prisma.frequenciaEstudante.count();
  const notasDepois = await prisma.notaEstudante.count();
  console.log(`\nDepois (antes do VACUUM): FrequenciaEstudante=${freqDepois} · NotaEstudante=${notasDepois}`);

  await prisma.$disconnect();

  // VACUUM FULL precisa de conexão direta (sem pooler) e não roda em transação.
  const directUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!directUrl) {
    console.log("\nDATABASE_URL_UNPOOLED não configurada — rode VACUUM FULL manualmente.");
    return;
  }

  const directPrisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
  console.log("\nRodando VACUUM FULL em FrequenciaEstudante...");
  await directPrisma.$executeRawUnsafe('VACUUM FULL "FrequenciaEstudante"');
  console.log("Rodando VACUUM FULL em NotaEstudante...");
  await directPrisma.$executeRawUnsafe('VACUUM FULL "NotaEstudante"');

  const [dbSize] = await directPrisma.$queryRawUnsafe<{ tamanho: string }[]>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanho`,
  );
  console.log(`\nTamanho do banco após VACUUM FULL: ${dbSize?.tamanho}`);

  await directPrisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  });
