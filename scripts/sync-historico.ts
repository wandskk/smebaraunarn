/**
 * Carga histórica de dados do SIGEduc, fora do fluxo normal de sync diário.
 *
 * Uso:
 *   npx tsx scripts/sync-historico.ts --anos=2024,2025
 *   npx tsx scripts/sync-historico.ts --anos=2024-2025 --modulos=estudantes,notas
 *   npx tsx scripts/sync-historico.ts --anos=2024 --continuar   (retoma de onde parou)
 *
 * Por ano, roda nesta ordem (a ordem importa: Notas/Frequência só gravam
 * quem já existe em Estudante — ver upsertEstudante em lib/sync/sigeduc-sync.ts):
 *   1. Estudantes matriculados naquele ano
 *   2. Notas daquele ano
 *   3. Frequência daquele ano, em janelas mensais (janela grande demais fica
 *      pesada demais por chamada — ver aviso em app/admin/sincronizacao)
 *
 * Resiliência: se um lote falhar (rede, timeout do provedor), registra o
 * erro e segue para o próximo — não aborta a carga inteira por causa de uma
 * falha pontual. Progresso é salvo em disco a cada etapa concluída, então
 * `--continuar` depois de uma queda pula direto pro que falta.
 */
import { syncEstudantesChunk, syncNotasChunk, syncFrequenciaChunk } from "../lib/sync/sigeduc-sync";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const PROGRESSO_PATH = join(__dirname, ".sync-historico-progresso.json");

type Modulo = "estudantes" | "notas" | "frequencia";
type ChaveEtapa = string; // `${ano}:${modulo}` ou `${ano}:frequencia:${mes}`

function carregarProgresso(): Set<ChaveEtapa> {
  if (!existsSync(PROGRESSO_PATH)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(PROGRESSO_PATH, "utf-8")));
  } catch {
    return new Set();
  }
}

function salvarProgresso(concluidas: Set<ChaveEtapa>) {
  writeFileSync(PROGRESSO_PATH, JSON.stringify([...concluidas]));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

  const anosArg = get("anos");
  if (!anosArg) {
    console.error("Uso: npx tsx scripts/sync-historico.ts --anos=2024,2025 [--modulos=estudantes,notas,frequencia] [--continuar]");
    process.exit(1);
  }
  const anos: number[] = anosArg.includes("-") && !anosArg.includes(",")
    ? (() => {
        const partes = anosArg.split("-").map(Number);
        const de = partes[0]!;
        const ate = partes[1]!;
        return Array.from({ length: ate - de + 1 }, (_, i) => de + i);
      })()
    : anosArg.split(",").map(Number);

  const modulosArg = get("modulos");
  const modulos: Modulo[] = (modulosArg ? modulosArg.split(",") : ["estudantes", "notas", "frequencia"]) as Modulo[];

  const continuar = args.includes("--continuar");

  return { anos, modulos, continuar };
}

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

async function rodarComRetentativa<T>(descricao: string, fn: () => Promise<T>): Promise<T | null> {
  const MAX_TENTATIVAS = 3;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERRO] ${descricao} (tentativa ${tentativa}/${MAX_TENTATIVAS}): ${msg}`);
      if (tentativa === MAX_TENTATIVAS) {
        console.error(`  [DESISTINDO] ${descricao} — siga em frente, retome depois com --continuar`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 5000 * tentativa));
    }
  }
  return null;
}

interface ResultadoEtapa {
  total: number;
  /** false quando alguma tentativa esgotou as 3 retentativas — a etapa NÃO deve ser marcada como concluída. */
  completo: boolean;
}

async function syncEstudantesAno(ano: number): Promise<ResultadoEtapa> {
  let index = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(`Estudantes ${ano} (índice ${index})`, () => syncEstudantesChunk(ano, index));
    if (result === null) return { total, completo: false };
    total += result.registrosNestaExecucao;
    done = result.done;
    index = result.nextIndex;
    console.log(`  Estudantes ${ano}: ${index}/${result.totalEscolas} escolas · +${result.registrosNestaExecucao}`);
  }
  return { total, completo: true };
}

async function syncNotasAno(ano: number): Promise<ResultadoEtapa> {
  let pagina = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(`Notas ${ano} (página ${pagina})`, () => syncNotasChunk(ano, pagina));
    if (result === null) return { total, completo: false };
    total += result.registrosNestaExecucao;
    done = result.done;
    pagina = result.nextPagina;
    console.log(`  Notas ${ano}: página ${pagina}/${result.totalPaginas} · +${result.registrosNestaExecucao}`);
  }
  return { total, completo: true };
}

async function syncFrequenciaMes(ano: number, mes: number): Promise<ResultadoEtapa> {
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${diasNoMes(ano, mes)}`;
  let pagina = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(
      `Frequência ${ano}-${mes} (página ${pagina})`,
      () => syncFrequenciaChunk(dataInicio, dataFim, pagina),
    );
    if (result === null) return { total, completo: false };
    total += result.registrosNestaExecucao;
    done = result.done;
    pagina = result.nextPagina;
  }
  return { total, completo: true };
}

async function main() {
  const { anos, modulos, continuar } = parseArgs();
  const concluidas = continuar ? carregarProgresso() : new Set<ChaveEtapa>();

  console.log(`=== Sincronização histórica: anos [${anos.join(", ")}], módulos [${modulos.join(", ")}] ===`);
  if (continuar) console.log(`Retomando: ${concluidas.size} etapa(s) já concluída(s) anteriormente.`);

  const inicioGeral = Date.now();
  let totalGeral = 0;

  for (const ano of anos.sort((a, b) => a - b)) {
    console.log(`\n--- Ano ${ano} ---`);

    if (modulos.includes("estudantes")) {
      const chave = `${ano}:estudantes`;
      if (concluidas.has(chave)) {
        console.log(`  Estudantes ${ano}: já concluído, pulando.`);
      } else {
        const t0 = Date.now();
        const { total, completo } = await syncEstudantesAno(ano);
        totalGeral += total;
        console.log(`  Estudantes ${ano}: ${total} registros em ${fmtMs(Date.now() - t0)}${completo ? "" : " — INCOMPLETO, precisa retomar"}`);
        if (completo) {
          concluidas.add(chave);
          salvarProgresso(concluidas);
        }
      }
    }

    if (modulos.includes("notas")) {
      const chave = `${ano}:notas`;
      if (concluidas.has(chave)) {
        console.log(`  Notas ${ano}: já concluído, pulando.`);
      } else {
        const t0 = Date.now();
        const { total, completo } = await syncNotasAno(ano);
        totalGeral += total;
        console.log(`  Notas ${ano}: ${total} registros em ${fmtMs(Date.now() - t0)}${completo ? "" : " — INCOMPLETO, precisa retomar"}`);
        if (completo) {
          concluidas.add(chave);
          salvarProgresso(concluidas);
        }
      }
    }

    if (modulos.includes("frequencia")) {
      for (let mes = 1; mes <= 12; mes++) {
        const chave = `${ano}:frequencia:${mes}`;
        if (concluidas.has(chave)) {
          console.log(`  Frequência ${ano}-${mes}: já concluído, pulando.`);
          continue;
        }
        const t0 = Date.now();
        const { total, completo } = await syncFrequenciaMes(ano, mes);
        totalGeral += total;
        console.log(`  Frequência ${ano}-${String(mes).padStart(2, "0")}: ${total} registros em ${fmtMs(Date.now() - t0)}${completo ? "" : " — INCOMPLETO, precisa retomar"}`);
        if (completo) {
          concluidas.add(chave);
          salvarProgresso(concluidas);
        }
      }
    }
  }

  console.log(`\n=== Concluído: ${totalGeral} registros em ${fmtMs(Date.now() - inicioGeral)} ===`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO FATAL:", err);
    process.exit(1);
  });
