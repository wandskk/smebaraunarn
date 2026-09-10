/**
 * Carga histórica de dados do SIGEduc, fora do fluxo normal de sync diário.
 *
 * Uso:
 *   npx tsx scripts/sync-historico.ts                              (modo interativo: pergunta ano/módulos)
 *   npx tsx scripts/sync-historico.ts --anos=2024,2025
 *   npx tsx scripts/sync-historico.ts --anos=2024-2025 --modulos=estudantes,notas
 *   npx tsx scripts/sync-historico.ts --anos=2024 --continuar   (retoma de onde parou)
 *
 * Sem --anos e rodando num terminal interativo, pergunta o(s) ano(s) e
 * módulos antes de começar. Com --anos informado (ou fora de um terminal,
 * ex. cron), segue direto sem perguntar — mantém compatível com automação.
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
import { createInterface } from "readline/promises";

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

const MODULOS_VALIDOS: Modulo[] = ["estudantes", "notas", "frequencia"];

function parseAnos(anosArg: string): number[] {
  return anosArg.includes("-") && !anosArg.includes(",")
    ? (() => {
        const partes = anosArg.split("-").map(Number);
        const de = partes[0]!;
        const ate = partes[1]!;
        return Array.from({ length: ate - de + 1 }, (_, i) => de + i);
      })()
    : anosArg.split(",").map((s) => Number(s.trim()));
}

interface Configuracao {
  anos: number[];
  modulos: Modulo[];
  continuar: boolean;
}

/** Lê configuração das flags de linha de comando (uso não-interativo / cron). */
function lerFlags(): Configuracao {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

  const anos = parseAnos(get("anos")!);
  const modulosArg = get("modulos");
  const modulos: Modulo[] = (modulosArg ? modulosArg.split(",") : MODULOS_VALIDOS) as Modulo[];
  const continuar = args.includes("--continuar");

  return { anos, modulos, continuar };
}

/** Pergunta ano(s) e módulos no terminal — usado quando --anos não foi passado. */
async function perguntarInterativo(): Promise<Configuracao> {
  const anoAtual = new Date().getFullYear();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    let anos: number[] = [];
    while (anos.length === 0) {
      const resposta = (
        await rl.question(
          `Ano(s) para sincronizar (ex: ${anoAtual} | ${anoAtual - 1},${anoAtual} | ${anoAtual - 2}-${anoAtual}) [${anoAtual}]: `,
        )
      ).trim();
      const candidatos = parseAnos(resposta || String(anoAtual));
      anos = candidatos.filter((a) => Number.isInteger(a) && a >= 2000 && a <= anoAtual + 1);
      if (anos.length === 0) console.log("  Entrada inválida, tente de novo (ex: 2025 ou 2024,2025 ou 2024-2025).");
    }

    const respostaModulos = (
      await rl.question(`Módulos — ${MODULOS_VALIDOS.join(",")} [Enter = todos]: `)
    ).trim();
    const modulos = respostaModulos
      ? respostaModulos
          .split(",")
          .map((m) => m.trim().toLowerCase())
          .filter((m): m is Modulo => (MODULOS_VALIDOS as string[]).includes(m))
      : MODULOS_VALIDOS;

    const progressoExistente = existsSync(PROGRESSO_PATH);
    const respostaContinuar = (
      await rl.question(
        progressoExistente
          ? "Encontrado progresso salvo de uma execução anterior. Retomar de onde parou? (S/n): "
          : "Retomar progresso salvo anteriormente, se houver? (s/N): ",
      )
    )
      .trim()
      .toLowerCase();
    const continuar = progressoExistente
      ? respostaContinuar !== "n" && respostaContinuar !== "não"
      : respostaContinuar === "s" || respostaContinuar === "sim";

    return { anos, modulos: modulos.length > 0 ? modulos : MODULOS_VALIDOS, continuar };
  } finally {
    rl.close();
  }
}

async function resolverConfiguracao(): Promise<Configuracao> {
  const anosArg = process.argv.slice(2).find((a) => a.startsWith("--anos="));
  if (anosArg) return lerFlags();

  if (!process.stdin.isTTY) {
    console.error("Uso: npx tsx scripts/sync-historico.ts --anos=2024,2025 [--modulos=estudantes,notas,frequencia] [--continuar]");
    process.exit(1);
  }

  console.log("=== Sincronização histórica (modo interativo) ===");
  return perguntarInterativo();
}

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Largura da barra em caracteres (só o miolo, sem contar "[" "]" e o texto). */
const LARGURA_BARRA = 28;

/**
 * Redesenha a barra na mesma linha (via \r) quando a saída é um terminal
 * interativo. Fora de um TTY (saída redirecionada pra arquivo, cron), imprime
 * uma linha por atualização — \r não faz sentido num arquivo de log, e isso
 * preserva o histórico de progresso nesse caso, como o comportamento antigo.
 */
function desenharBarra(atual: number, total: number, prefixo: string) {
  const pct = total > 0 ? Math.min(1, atual / total) : 0;
  const preenchidos = Math.round(LARGURA_BARRA * pct);
  const barra = "#".repeat(preenchidos) + "-".repeat(LARGURA_BARRA - preenchidos);
  const linha = `  ${prefixo} [${barra}] ${String(Math.round(pct * 100)).padStart(3)}% (${atual}/${total})`;
  if (process.stdout.isTTY) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(linha);
  } else {
    console.log(linha);
  }
}

/** Fecha a linha da barra antes de seguir para o próximo log normal. */
function finalizarBarra() {
  if (process.stdout.isTTY) process.stdout.write("\n");
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
      finalizarBarra();
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
  const prefixo = `Estudantes ${ano}`;
  let index = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(`${prefixo} (índice ${index})`, () =>
      syncEstudantesChunk(ano, index, undefined, (atual, totalEscolas) => desenharBarra(atual, totalEscolas, prefixo)),
    );
    if (result === null) {
      finalizarBarra();
      return { total, completo: false };
    }
    total += result.registrosNestaExecucao;
    done = result.done;
    index = result.nextIndex;
    desenharBarra(index, result.totalEscolas, prefixo);
  }
  finalizarBarra();
  return { total, completo: true };
}

async function syncNotasAno(ano: number): Promise<ResultadoEtapa> {
  const prefixo = `Notas ${ano}`;
  let pagina = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(`${prefixo} (página ${pagina})`, () =>
      syncNotasChunk(ano, pagina, undefined, (atual, totalPaginas) => desenharBarra(atual, totalPaginas, prefixo)),
    );
    if (result === null) {
      finalizarBarra();
      return { total, completo: false };
    }
    total += result.registrosNestaExecucao;
    done = result.done;
    pagina = result.nextPagina;
    desenharBarra(pagina, result.totalPaginas, prefixo);
  }
  finalizarBarra();
  return { total, completo: true };
}

async function syncFrequenciaMes(ano: number, mes: number): Promise<ResultadoEtapa> {
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${diasNoMes(ano, mes)}`;
  const prefixo = `Frequência ${ano}-${String(mes).padStart(2, "0")}`;
  let pagina = 0;
  let total = 0;
  let done = false;
  while (!done) {
    const result = await rodarComRetentativa(`${prefixo} (página ${pagina})`, () =>
      syncFrequenciaChunk(dataInicio, dataFim, pagina, undefined, (atual, totalPaginas) =>
        desenharBarra(atual, totalPaginas, prefixo),
      ),
    );
    if (result === null) {
      finalizarBarra();
      return { total, completo: false };
    }
    total += result.registrosNestaExecucao;
    done = result.done;
    pagina = result.nextPagina;
    desenharBarra(pagina, result.totalPaginas, prefixo);
  }
  finalizarBarra();
  return { total, completo: true };
}

async function main() {
  const { anos, modulos, continuar } = await resolverConfiguracao();
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
