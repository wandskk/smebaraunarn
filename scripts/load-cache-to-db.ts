/**
 * Lê os arquivos salvos por scripts/cache-historico.ts e grava no banco —
 * roda depois de resolver o espaço do Postgres, sem precisar buscar da API
 * de novo. Reaproveita a mesma lógica de gravação do sync ao vivo
 * (aplicarPaginaNotas/aplicarPaginaFrequencia em lib/sync/sigeduc-sync.ts),
 * incluindo a transação delete+insert que evita perder dados se o banco
 * ficar sem espaço no meio da carga.
 *
 * Uso:
 *   npx tsx scripts/load-cache-to-db.ts --tipo=notas --ano=2025
 *   npx tsx scripts/load-cache-to-db.ts --tipo=frequencia --ano=2025 --meses=2-12
 */
import { prisma } from "../lib/prisma";
import { aplicarPaginaNotas, aplicarPaginaFrequencia } from "../lib/sync/sigeduc-sync";
import type { ConsultaNotaAluno, ConsultaFrequenciaAluno } from "../lib/sigeduc";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(__dirname, ".staging");

async function carregarEstudantesValidos(): Promise<Set<string>> {
  const estudantes = await prisma.estudante.findMany({ select: { matricula: true } });
  return new Set(estudantes.map((e) => e.matricula));
}

function listarPaginas(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith("pagina-") && f.endsWith(".json"))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
}

async function carregarNotas(ano: number, estudantesValidos: Set<string>) {
  const dir = join(CACHE_DIR, "notas", String(ano));
  const arquivos = listarPaginas(dir);
  if (arquivos.length === 0) {
    console.log(`  Notas ${ano}: nada em cache.`);
    return 0;
  }

  let total = 0;
  for (const arquivo of arquivos) {
    const dados: ConsultaNotaAluno[] = JSON.parse(readFileSync(join(dir, arquivo), "utf-8"));
    const registros = await aplicarPaginaNotas(ano, estudantesValidos, dados);
    total += registros;
    console.log(`  Notas ${ano} ${arquivo}: +${registros} registros gravados`);
  }
  return total;
}

async function carregarFrequenciaMes(ano: number, mes: number, estudantesValidos: Set<string>) {
  const chaveMes = `${ano}-${String(mes).padStart(2, "0")}`;
  const dir = join(CACHE_DIR, "frequencia", chaveMes);
  const arquivos = listarPaginas(dir);
  if (arquivos.length === 0) {
    console.log(`  Frequência ${chaveMes}: nada em cache.`);
    return 0;
  }

  const dataInicio = `${chaveMes}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFim = `${chaveMes}-${ultimoDia}`;

  let total = 0;
  for (const arquivo of arquivos) {
    const dados: ConsultaFrequenciaAluno[] = JSON.parse(readFileSync(join(dir, arquivo), "utf-8"));
    const registros = await aplicarPaginaFrequencia(dataInicio, dataFim, estudantesValidos, dados);
    total += registros;
    console.log(`  Frequência ${chaveMes} ${arquivo}: +${registros} registros gravados`);
  }
  return total;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

  const tipo = get("tipo") as "notas" | "frequencia" | undefined;
  const ano = Number(get("ano"));
  const mesesArg = get("meses");

  if (!tipo || !ano) {
    console.error("Uso: npx tsx scripts/load-cache-to-db.ts --tipo=notas|frequencia --ano=2025 [--meses=1-12]");
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
  console.log(`=== Gravando cache local no banco: ${tipo} ${ano} ===`);

  const estudantesValidos = await carregarEstudantesValidos();

  let total = 0;
  if (tipo === "notas") {
    total = await carregarNotas(ano, estudantesValidos);
  } else {
    for (const mes of meses) {
      total += await carregarFrequenciaMes(ano, mes, estudantesValidos);
    }
  }

  console.log(`\n=== Concluído: ${total} registros gravados ===`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  });
