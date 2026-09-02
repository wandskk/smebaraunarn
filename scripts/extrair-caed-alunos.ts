import { chromium, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { execSync } from "node:child_process";
import { CAED_ANOS_ESCOLARES } from "../lib/caed-catalogo";

/**
 * Extrai o nível de aluno da Avaliação Contínua da Aprendizagem direto da
 * API que o próprio portal Criança Alfabetizada (CAEd/UFJF) usa
 * (`portal/functions/getDadosResultado`), em vez de raspar a tabela em
 * tela turma por turma.
 *
 * Como foi descoberto (sessão de 2026-09-02): a API aceita agregar em
 * qualquer nível da hierarquia (`agregado` + `nivelAbaixo`). A tela só usa
 * um clique por vez (desce 1 nível), mas pedindo `nivelAbaixo: 3` a partir
 * do código do MUNICÍPIO (não da escola/turma) o mesmo endpoint devolve o
 * resultado de TODAS as escolas/turmas da rede numa única chamada — em vez
 * de dezenas de cliques manuais por escola/turma/página.
 *
 * Login (gov.br, com captcha) não dá pra automatizar — o usuário loga
 * manualmente na janela que este script abre. Depois disso, tudo é
 * automático: o script intercepta UMA chamada real da tela (feita ao
 * clicar numa turma qualquer) pra descobrir o formato exato da requisição
 * (token de sessão, lista de indicadores, etc.) e o código do município, e
 * a partir daí varre sozinho todas as combinações de ciclo/ano
 * escolar/componente.
 *
 * Uso:
 *   npx tsx scripts/extrair-caed-alunos.ts
 *   npx tsx scripts/extrair-caed-alunos.ts --cdp   (conecta num Chrome já aberto com --remote-debugging-port=9222)
 */

const ARQUIVO_SAIDA = path.join(process.cwd(), "scripts", "caed_dados_alunos.jsonl");
const DIRETORIO_SESSAO = path.join(process.cwd(), ".caed_session");
const URL_API = "https://criancaalfabetizada.caeddigital.net/portal/functions/getDadosResultado";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (pergunta: string) => new Promise<string>((resolve) => rl.question(pergunta, resolve));

const CICLOS = ["AV12026", "AV22026"] as const;
const DISCIPLINAS = ["LÍNGUA PORTUGUESA", "ESCRITA", "MATEMÁTICA", "FLUÊNCIA"] as const;

interface RequisicaoBase {
  CD_INDICADOR: string[];
  agregado: string;
  filtros: { operation: string; field: string; value: string }[];
  filtrosAdicionais: unknown[];
  nivelAbaixo: string;
  ordenacao: unknown;
  CD_INDICADOR_LABEL: unknown[];
  TP_ENTIDADE_LABEL: string;
  _ApplicationId: string;
  _ClientVersion: string;
  _InstallationId: string;
  _SessionToken: string;
}

interface RegistroApi {
  NM_ENTIDADE: string;
  FL_PARTICIPACAO: string;
  DC_PONTUACAO: string | null;
  DC_HIERARQUIA: string;
}

interface LinhaBruta {
  ciclo: "AV1" | "AV2";
  anoEscolar: string;
  componente: string;
  escola: string;
  turma: string;
  pagina: number;
  alunos: [string, string, string][];
}

function cicloParaCodigo(ciclo: (typeof CICLOS)[number]): "AV1" | "AV2" {
  return ciclo === "AV12026" ? "AV1" : "AV2";
}

function disciplinaParaComponente(disciplina: (typeof DISCIPLINAS)[number]): string {
  switch (disciplina) {
    case "LÍNGUA PORTUGUESA":
      return "LP_LEITURA";
    case "ESCRITA":
      return "LP_ESCRITA";
    case "MATEMÁTICA":
      return "MATEMATICA";
    case "FLUÊNCIA":
      return "FLUENCIA";
  }
}

function anoEtapaParaCodigo(etapa: string): string {
  const item = CAED_ANOS_ESCOLARES.find((a) => a.valor === etapa);
  if (!item) throw new Error(`Ano escolar sem mapeamento: ${etapa}`);
  const numero = item.valor.match(/(\d)º ANO/)![1];
  return `${numero}ANO`;
}

/**
 * Injeta um interceptador de XHR na página — a mesma técnica usada pra
 * descobrir o endpoint durante a investigação manual (o app é AngularJS,
 * usa XHR, não `fetch`). Guarda a última chamada a `getDadosResultado` em
 * `window.__ultimaChamadaCaed`.
 */
async function instalarInterceptador(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __ultimaChamadaCaed?: { requestBody: string; responseText: string } };
    if ((window as unknown as { __xhrPatchedCaed?: boolean }).__xhrPatchedCaed) return;
    (window as unknown as { __xhrPatchedCaed: boolean }).__xhrPatchedCaed = true;
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __url?: string }, method: string, url: string, ...rest: unknown[]) {
      this.__url = url;
      // @ts-expect-error assinatura variádica do XHR nativo
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __url?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener("load", () => {
        if (this.__url && this.__url.includes("getDadosResultado")) {
          w.__ultimaChamadaCaed = { requestBody: String(body ?? ""), responseText: this.responseText };
        }
      });
      return origSend.call(this, body as never);
    };
  });
}

async function capturarRequisicaoBase(page: Page): Promise<{ base: RequisicaoBase; codigoMunicipio: string }> {
  const capturada = await page.evaluate(() => {
    return (window as unknown as { __ultimaChamadaCaed?: { requestBody: string; responseText: string } }).__ultimaChamadaCaed ?? null;
  });
  if (!capturada) {
    throw new Error(
      "Nenhuma chamada à API foi capturada ainda. Clique numa turma qualquer (até a tabela de alunos aparecer) antes de continuar.",
    );
  }
  const base = JSON.parse(capturada.requestBody) as RequisicaoBase;
  const resposta = JSON.parse(capturada.responseText) as { result?: RegistroApi[] };
  const primeiraLinha = resposta.result?.[0];
  if (!primeiraLinha) throw new Error("A chamada capturada não trouxe nenhum resultado — tente clicar numa turma com alunos.");
  // DC_HIERARQUIA: "<nacional> / <uf> / <?> / <município> / <escola> / <turma> / <aluno>"
  const codigoMunicipio = primeiraLinha.DC_HIERARQUIA.split(" / ")[3];
  if (!codigoMunicipio) throw new Error("Não foi possível extrair o código do município de DC_HIERARQUIA.");
  return { base, codigoMunicipio };
}

async function buscarCombinacao(
  page: Page,
  base: RequisicaoBase,
  codigoMunicipio: string,
  ciclo: (typeof CICLOS)[number],
  anoEtapa: string,
  disciplina: (typeof DISCIPLINAS)[number],
): Promise<RegistroApi[]> {
  const body: RequisicaoBase = {
    ...base,
    agregado: codigoMunicipio,
    nivelAbaixo: "3",
    filtros: [
      { operation: "equalTo", field: "DADOS.VL_FILTRO_AVALIACAO", value: ciclo },
      { operation: "equalTo", field: "DADOS.VL_FILTRO_ETAPA", value: anoEtapa },
      { operation: "equalTo", field: "DADOS.VL_FILTRO_DISCIPLINA", value: disciplina },
    ],
  };
  const resultado = await page.evaluate(
    async ({ url, body }) => {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await resp.json()) as { result?: RegistroApi[]; error?: string };
      if (json.error) throw new Error(json.error);
      return json.result ?? [];
    },
    { url: URL_API, body },
  );
  return resultado;
}

/** Agrupa os registros (flat, um por aluno) em blocos por escola+turma — mesmo formato que scripts/importar-caed-aluno.ts espera. */
function agruparEmLinhasBrutas(
  registros: RegistroApi[],
  ciclo: (typeof CICLOS)[number],
  anoEtapa: string,
  disciplina: (typeof DISCIPLINAS)[number],
): LinhaBruta[] {
  const cicloCode = cicloParaCodigo(ciclo);
  const anoEscolar = anoEtapaParaCodigo(anoEtapa);
  const componente = disciplinaParaComponente(disciplina);

  const grupos = new Map<string, [string, string, string][]>();
  for (const r of registros) {
    const partes = r.DC_HIERARQUIA.split(" / ");
    const escolaCodigo = partes[4];
    const turmaCodigo = partes[5];
    if (!escolaCodigo || !turmaCodigo) continue;
    const chave = `${escolaCodigo}|${turmaCodigo}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push([r.NM_ENTIDADE, r.FL_PARTICIPACAO === "Sim" ? "SIM" : "NÃO", r.DC_PONTUACAO ? r.DC_PONTUACAO.toUpperCase() : "-"]);
  }

  let pagina = 1;
  const linhas: LinhaBruta[] = [];
  for (const [chave, alunos] of grupos) {
    const [escolaCodigo, turmaCodigo] = chave.split("|");
    linhas.push({
      ciclo: cicloCode,
      anoEscolar,
      componente,
      escola: `ESCOLA - ${escolaCodigo}`,
      turma: turmaCodigo!,
      pagina: pagina++,
      alunos,
    });
  }
  return linhas;
}

async function main() {
  const usarCdp = process.argv.includes("--cdp");
  console.log("\n========================================================");
  console.log("   Extrator CAEd (Criança Alfabetizada) via API direta   ");
  console.log("========================================================\n");

  let browserContext;
  let page: Page;

  if (usarCdp) {
    console.log("Conectando ao Chrome na porta 9222 (CDP)...");
    try {
      const browser = await chromium.connectOverCDP("http://localhost:9222");
      browserContext = browser.contexts()[0]!;
      page = browserContext.pages()[0] ?? (await browserContext.newPage());
      console.log("Conectado com sucesso ao Chrome!");
    } catch {
      console.error("Não foi possível conectar na porta 9222. Certifique-se de que o Chrome foi iniciado com '--remote-debugging-port=9222'.");
      process.exit(1);
    }
  } else {
    const caminhosChrome = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];
    const executavel = caminhosChrome.find((c) => fs.existsSync(c));
    console.log(`Abrindo navegador (${executavel ? "Google Chrome" : "Chromium"}) com perfil persistente (.caed_session)...`);
    browserContext = await chromium.launchPersistentContext(DIRETORIO_SESSAO, {
      executablePath: executavel,
      headless: false,
      viewport: { width: 1280, height: 800 },
      args: ["--start-maximized"],
    });
    page = browserContext.pages()[0] ?? (await browserContext.newPage());
    await page.goto("https://criancaalfabetizada.caeddigital.net/");
  }

  await instalarInterceptador(page);
  page.on("framenavigated", () => {
    instalarInterceptador(page).catch(() => {});
  });

  console.log("\nFaça login (gov.br ou senha) e navegue até Resultados.");
  console.log("Escolha qualquer filtro, clique numa escola e depois numa turma até a tabela de alunos aparecer em tela.");
  console.log("Isso só precisa ser feito UMA vez — é só pra capturar o formato da requisição.");
  await ask("\nQuando a tabela de alunos de uma turma estiver em tela, pressione [ENTER] para continuar...");

  console.log("\nCapturando formato da requisição e código do município...");
  const { base, codigoMunicipio } = await capturarRequisicaoBase(page);
  console.log(`Código do município detectado: ${codigoMunicipio}`);

  const anos = CAED_ANOS_ESCOLARES.map((a) => a.valor);
  const combinacoes = CICLOS.flatMap((ciclo) => anos.flatMap((ano) => DISCIPLINAS.map((disciplina) => ({ ciclo, ano, disciplina }))));

  console.log(`\nVarrendo ${combinacoes.length} combinações (${CICLOS.length} ciclos × ${anos.length} anos × ${DISCIPLINAS.length} componentes)...`);
  console.log("Combinações sem aplicação nesse componente/ano voltam vazias — isso é esperado, não é erro.\n");

  let totalLinhas = 0;
  let totalAlunos = 0;
  for (const { ciclo, ano, disciplina } of combinacoes) {
    const chave = `${ciclo} | ${ano} | ${disciplina}`;
    try {
      const registros = await buscarCombinacao(page, base, codigoMunicipio, ciclo, ano, disciplina);
      if (registros.length === 0) {
        console.log(`${chave}: 0 registros (sem aplicação nessa combinação)`);
        continue;
      }
      const linhas = agruparEmLinhasBrutas(registros, ciclo, ano, disciplina);
      for (const linha of linhas) fs.appendFileSync(ARQUIVO_SAIDA, JSON.stringify(linha) + "\n", "utf8");
      totalLinhas += linhas.length;
      totalAlunos += registros.length;
      console.log(`${chave}: ${registros.length} alunos em ${linhas.length} bloco(s) escola+turma — gravado`);
    } catch (err) {
      console.log(`${chave}: erro — ${err instanceof Error ? err.message : String(err)}`);
    }
    // pausa curta entre chamadas — sem necessidade de velocidade, só não martelar o servidor
    await page.waitForTimeout(300);
  }

  console.log(`\nTotal: ${totalAlunos} alunos em ${totalLinhas} blocos escola+turma, salvos em ${ARQUIVO_SAIDA}`);

  const rodarImportacao = (await ask("\nRodar a importação para o banco agora? (s/N): ")).trim().toLowerCase();
  if (rodarImportacao === "s") {
    console.log(`\nRodando: npx tsx scripts/importar-caed-aluno.ts ${ARQUIVO_SAIDA}`);
    try {
      execSync(`npx tsx scripts/importar-caed-aluno.ts "${ARQUIVO_SAIDA}"`, { stdio: "inherit" });
      console.log("\nImportação concluída.");
    } catch (err) {
      console.error("Erro ao executar importação:", err);
    }
  } else {
    console.log(`\nArquivo salvo. Para importar depois: npx tsx scripts/importar-caed-aluno.ts ${ARQUIVO_SAIDA}`);
  }

  rl.close();
  await browserContext.close();
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
