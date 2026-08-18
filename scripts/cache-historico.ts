/**
 * Busca dados históricos do SIGEduc e salva localmente em disco, SEM tocar
 * no banco. Existe pra desacoplar "conversar com a API" (a parte sensível/
 * demorada, que não queremos refazer) de "gravar no Postgres" (a parte
 * limitada pelo espaço do plano) — depois de rodar isso, o load-cache-to-db
 * carrega pro banco quando houver espaço, sem precisar buscar de novo.
 *
 * Uso:
 *   npx tsx scripts/cache-historico.ts --tipo=notas --ano=2025
 *   npx tsx scripts/cache-historico.ts --tipo=frequencia --ano=2025 --meses=2-12
 *
 * Idempotente: pula página/mês já salvo em disco, então pode interromper
 * (Ctrl+C) e rodar de novo sem duplicar chamadas à API.
 */
import { consultarNotas, consultarFrequencia } from "../lib/sigeduc";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(__dirname, ".staging");

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function garantirDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function cacheNotas(ano: number) {
  const dir = join(CACHE_DIR, "notas", String(ano));
  garantirDir(dir);

  let pagina = 0;
  let totalPaginas = 1;
  let totalRegistros = 0;
  while (pagina < totalPaginas) {
    const arquivo = join(dir, `pagina-${pagina}.json`);
    if (existsSync(arquivo)) {
      console.log(`  [cache] notas ${ano} página ${pagina} já salva, pulando`);
      pagina += 1;
      continue;
    }
    const resposta = await consultarNotas(ano, pagina, 300);
    totalPaginas = resposta.totalPaginas;
    writeFileSync(arquivo, JSON.stringify(resposta.dados));
    totalRegistros += resposta.dados.length;
    console.log(`  notas ${ano}: página ${pagina + 1}/${totalPaginas} salva (${resposta.dados.length} alunos)`);
    pagina += 1;
  }
  console.log(`Notas ${ano}: ${totalPaginas} página(s) em cache.`);
}

async function cacheFrequenciaMes(ano: number, mes: number) {
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${diasNoMes(ano, mes)}`;
  const dir = join(CACHE_DIR, "frequencia", `${ano}-${String(mes).padStart(2, "0")}`);
  garantirDir(dir);

  let pagina = 0;
  let totalPaginas = 1;
  while (pagina < totalPaginas) {
    const arquivo = join(dir, `pagina-${pagina}.json`);
    if (existsSync(arquivo)) {
      pagina += 1;
      continue;
    }
    const resposta = await consultarFrequencia(dataInicio, dataFim, pagina, 300);
    totalPaginas = resposta.totalPaginas;
    writeFileSync(arquivo, JSON.stringify(resposta.dados));
    console.log(`  frequência ${ano}-${mes}: página ${pagina + 1}/${totalPaginas} salva (${resposta.dados.length} alunos)`);
    pagina += 1;
  }
  console.log(`Frequência ${ano}-${String(mes).padStart(2, "0")}: ${totalPaginas} página(s) em cache.`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

  const tipo = get("tipo") as "notas" | "frequencia" | undefined;
  const ano = Number(get("ano"));
  const mesesArg = get("meses");

  if (!tipo || !ano) {
    console.error("Uso: npx tsx scripts/cache-historico.ts --tipo=notas|frequencia --ano=2025 [--meses=1-12]");
    process.exit(1);
  }

  let meses = Array.from({ length: 12 }, (_, i) => i + 1);
  if (mesesArg) {
    const partes = mesesArg.split("-").map(Number);
    meses = Array.from({ length: partes[1]! - partes[0]! + 1 }, (_, i) => partes[0]! + i);
  }

  return { tipo, ano, meses };
}

async function main() {
  const { tipo, ano, meses } = parseArgs();
  console.log(`=== Cache local (sem tocar no banco): ${tipo} ${ano} ===`);

  if (tipo === "notas") {
    await cacheNotas(ano);
  } else {
    for (const mes of meses) {
      await cacheFrequenciaMes(ano, mes);
    }
  }
  console.log("Concluído. Arquivos em scripts/.staging/ — use load-cache-to-db.ts pra gravar no banco.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  });
