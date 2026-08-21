/**
 * Consulta somente leitura: tamanho total do banco e por tabela, via
 * funções nativas do Postgres (pg_database_size / pg_total_relation_size).
 * Útil para monitorar o limite de armazenamento do plano do Neon
 * (ver LogSincronizacao — erro Postgres 53100 "project size limit exceeded").
 *
 * Uso: npx tsx scripts/db-tamanho.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
  const [dbSize] = await prisma.$queryRawUnsafe<{ tamanho: string; bytes: bigint }[]>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanho,
            pg_database_size(current_database()) AS bytes`,
  );
  if (!dbSize) throw new Error("pg_database_size não retornou nenhuma linha.");
  console.log(`=== Tamanho total do banco: ${dbSize.tamanho} (${dbSize.bytes} bytes) ===\n`);

  const tabelas = await prisma.$queryRawUnsafe<
    { tabela: string; tamanho_total: string; tamanho_indices: string; linhas: bigint }[]
  >(`
    SELECT
      relname AS tabela,
      pg_size_pretty(pg_total_relation_size(relid)) AS tamanho_total,
      pg_size_pretty(pg_indexes_size(relid)) AS tamanho_indices,
      n_live_tup AS linhas
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `);

  console.log("Tabela".padEnd(30), "Tamanho total".padEnd(16), "Índices".padEnd(12), "Linhas (estimado)");
  for (const t of tabelas) {
    console.log(t.tabela.padEnd(30), t.tamanho_total.padEnd(16), t.tamanho_indices.padEnd(12), t.linhas.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  });
