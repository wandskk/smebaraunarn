/**
 * Consulta somente leitura: quebra FrequenciaEstudante e NotaEstudante por
 * ano, pra saber quanto espaço cada ano ocupa antes de decidir o que podar.
 *
 * Uso: npx tsx scripts/db-tamanho-por-ano.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== FrequenciaEstudante por ano (extraído de `data`) ===");
  const freq = await prisma.$queryRawUnsafe<{ ano: string; linhas: bigint }[]>(`
    SELECT LEFT(data, 4) AS ano, COUNT(*) AS linhas
    FROM "FrequenciaEstudante"
    GROUP BY LEFT(data, 4)
    ORDER BY ano;
  `);
  for (const f of freq) console.log(`  ${f.ano}: ${f.linhas.toLocaleString("pt-BR")} linhas`);

  console.log("\n=== NotaEstudante por ano ===");
  const notas = await prisma.$queryRawUnsafe<{ ano: number; linhas: bigint }[]>(`
    SELECT ano, COUNT(*) AS linhas
    FROM "NotaEstudante"
    GROUP BY ano
    ORDER BY ano;
  `);
  for (const n of notas) console.log(`  ${n.ano}: ${n.linhas.toLocaleString("pt-BR")} linhas`);

  console.log("\n=== Estudante por ano (snapshot mais recente por id) ===");
  const est = await prisma.$queryRawUnsafe<{ ano: number; linhas: bigint }[]>(`
    SELECT ano, COUNT(*) AS linhas
    FROM "Estudante"
    GROUP BY ano
    ORDER BY ano;
  `);
  for (const e of est) console.log(`  ${e.ano}: ${e.linhas.toLocaleString("pt-BR")} linhas`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  });
