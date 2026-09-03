import { chromium, type BrowserContext, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { execSync } from "node:child_process";
import { CAED_ANOS_ESCOLARES } from "../lib/caed-catalogo";

/**
 * Extrai o agregado por ESCOLA (participação, defasagem/intermediário/
 * adequado, acerto por habilidade) direto da API que o portal Criança
 * Alfabetizada (CAEd/UFJF) usa (`portal/functions/getDadosResultado`) — mesma
 * API e mesma técnica de `extrair-caed-alunos.ts` (que desce até aluno,
 * `nivelAbaixo: 3`), só que parando um nível acima, em ESCOLA
 * (`nivelAbaixo: 1` a partir do município).
 *
 * Diferença chave em relação ao extrator de aluno: aquele sabe de antemão
 * quais campos usar (`FL_PARTICIPACAO`, `DC_PONTUACAO`) porque foram
 * descobertos manualmente clicando na tabela de alunos. Aqui ainda não
 * validamos ao vivo o formato exato da resposta em nível de escola — por
 * isso este script faz só a CAPTURA BRUTA (sem interpretar campo por campo):
 * grava cada registro devolvido pela API, sem alterar nada, em
 * `caed_dados_escolas_raw.jsonl`. Quem interpreta os campos é
 * `scripts/mapear-caed-escolas.ts` (roda offline, sem precisar login de
 * novo) — assim, se o mapeamento inicial errar o nome de algum campo, a
 * correção não exige repetir login/varredura, só ajustar e rerodar o
 * mapeador sobre o arquivo já salvo.
 *
 * Também captura MAIS DE UM "template" de requisição (não só a última
 * chamada) — a página de Resultados faz várias chamadas por combinação
 * (uma pra participação/desempenho, outra pra acerto por habilidade, etc.,
 * cada uma com um `CD_INDICADOR` diferente) — pra aumentar a chance de já
 * trazer os dois tipos de indicador na primeira varredura.
 *
 * Uso:
 *   npx tsx scripts/extrair-caed-escolas.ts
 *   npx tsx scripts/extrair-caed-escolas.ts --cdp   (conecta num Chrome já aberto com --remote-debugging-port=9222)
 */

const ARQUIVO_SAIDA_BRUTO = path.join(process.cwd(), "scripts", "caed_dados_escolas_raw.jsonl");
const DIRETORIO_SESSAO = path.join(process.cwd(), ".caed_session");
const URL_API = "https://criancaalfabetizada.caeddigital.net/portal/functions/getDadosResultado";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (pergunta: string) => new Promise<string>((resolve) => rl.question(pergunta, resolve));

/** Ciclos disponíveis por ano — 2025 foi o único até agora com Ciclo III. */
const CICLOS_POR_ANO: Record<number, string[]> = {
  2024: ["AV12024", "AV22024"],
  2025: ["AV12025", "AV22025", "AV32025"],
  2026: ["AV12026", "AV22026"],
};
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

/** Ainda não sabemos os nomes exatos dos campos em nível de escola — captura tudo, sem tipar. */
type RegistroApiBruto = Record<string, unknown> & { DC_HIERARQUIA?: string };

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

/** Mesma técnica de `extrair-caed-alunos.ts`, mas guarda TODAS as chamadas distintas (não só a última) em `window.__todasBasesCaed`. */
async function instalarInterceptador(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __todasBasesCaed?: { requestBody: string; responseText: string }[] };
    if ((window as unknown as { __xhrPatchedCaedEscolas?: boolean }).__xhrPatchedCaedEscolas) return;
    (window as unknown as { __xhrPatchedCaedEscolas: boolean }).__xhrPatchedCaedEscolas = true;
    w.__todasBasesCaed = w.__todasBasesCaed ?? [];
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __url?: string }, method: string, url: string, ...rest: unknown[]) {
      this.__url = url;
      // @ts-expect-error assinatura variádica do XHR nativo
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __url?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener("load", () => {
        if (this.__url && this.__url.includes("getDadosResultado") && this.responseText) {
          w.__todasBasesCaed!.push({ requestBody: String(body ?? ""), responseText: this.responseText });
        }
      });
      return origSend.call(this, body as never);
    };
  });
}

interface TemplateCapturado {
  base: RequisicaoBase;
  codigoMunicipio: string;
}

/**
 * Deduplica por assinatura de `CD_INDICADOR` — só interessa 1 exemplar de
 * cada "tipo" de chamada. Lê de TODAS as abas abertas no contexto (não só
 * uma) — em modo `--cdp` o usuário pode ter aberto o CAEd numa aba nova
 * diferente da que o script pegou ao conectar, e cada aba tem seu próprio
 * `window`/interceptador.
 */
async function capturarTemplates(browserContext: BrowserContext): Promise<TemplateCapturado[]> {
  const paginas = browserContext.pages();
  const porPagina = await Promise.all(
    paginas.map((p) =>
      p
        .evaluate(() => (window as unknown as { __todasBasesCaed?: { requestBody: string; responseText: string }[] }).__todasBasesCaed ?? [])
        .catch(() => []),
    ),
  );
  const capturadas = porPagina.flat();
  if (capturadas.length === 0) {
    const urls = paginas.map((p) => p.url()).join(", ") || "(nenhuma aba aberta)";
    throw new Error(
      `Nenhuma chamada à API foi capturada ainda em nenhuma aba (abas abertas: ${urls}). ` +
        "Confirme que está navegando na tela de Resultados (criancaalfabetizada.caeddigital.net) e trocou algum filtro antes de continuar.",
    );
  }

  const porAssinatura = new Map<string, TemplateCapturado>();
  for (const c of capturadas) {
    try {
      const base = JSON.parse(c.requestBody) as RequisicaoBase;
      const resposta = JSON.parse(c.responseText) as { result?: RegistroApiBruto[] };
      const primeiraLinha = resposta.result?.[0];
      if (!primeiraLinha?.DC_HIERARQUIA) continue;
      const codigoMunicipio = primeiraLinha.DC_HIERARQUIA.split(" / ")[3];
      if (!codigoMunicipio) continue;
      const assinatura = JSON.stringify([...(base.CD_INDICADOR ?? [])].sort());
      if (!porAssinatura.has(assinatura)) porAssinatura.set(assinatura, { base, codigoMunicipio });
    } catch {
      // resposta que não é desse formato (ex.: outra função do portal) — ignora
    }
  }
  if (porAssinatura.size === 0) {
    throw new Error("Nenhuma chamada capturada tinha o formato esperado (com DC_HIERARQUIA). Tente trocar algum filtro na tela de Resultados.");
  }
  return Array.from(porAssinatura.values());
}

async function buscarCombinacaoEscola(
  page: Page,
  base: RequisicaoBase,
  codigoMunicipio: string,
  ciclo: string,
  anoEtapa: string,
  disciplina: (typeof DISCIPLINAS)[number],
): Promise<RegistroApiBruto[]> {
  const body: RequisicaoBase = {
    ...base,
    agregado: codigoMunicipio,
    nivelAbaixo: "1", // 1 nível abaixo do município = escola
    filtros: [
      { operation: "equalTo", field: "DADOS.VL_FILTRO_AVALIACAO", value: ciclo },
      { operation: "equalTo", field: "DADOS.VL_FILTRO_ETAPA", value: anoEtapa },
      { operation: "equalTo", field: "DADOS.VL_FILTRO_DISCIPLINA", value: disciplina },
    ],
  };
  return page.evaluate(
    async ({ url, body }) => {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await resp.json()) as { result?: Record<string, unknown>[]; error?: string };
      if (json.error) throw new Error(json.error);
      return json.result ?? [];
    },
    { url: URL_API, body },
  );
}

async function main() {
  const usarCdp = process.argv.includes("--cdp");
  console.log("\n==================================================================");
  console.log("   Extrator CAEd — agregado por ESCOLA via API direta (captura bruta)   ");
  console.log("==================================================================\n");

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
    await page.goto("https://criancaalfabetizada.caeddigital.net/#!/pagina/VIEW_RESULTADOS");
  }

  // Instala em TODAS as abas já abertas no contexto, e em qualquer aba nova
  // que for aberta depois (ex.: usuário abre uma aba nova pra acessar o
  // CAEd em vez de reaproveitar a que o script pegou ao conectar) — sem
  // isso, mudar de aba faz o interceptador "escutar" a aba errada.
  for (const p of browserContext.pages()) {
    await instalarInterceptador(p);
    p.on("framenavigated", () => instalarInterceptador(p).catch(() => {}));
  }
  browserContext.on("page", (novaPagina) => {
    instalarInterceptador(novaPagina).catch(() => {});
    novaPagina.on("framenavigated", () => instalarInterceptador(novaPagina).catch(() => {}));
  });

  console.log("\nFaça login (gov.br ou senha) se necessário e vá até 'Resultados'.");
  console.log("IMPORTANTE: clique em CADA UMA das abas 'Resultados 2026' / 'Resultados 2025' / 'Resultados 2024'");
  console.log("(o código do indicador que a API usa muda de ano pra ano — sem visitar a aba do ano, a varredura");
  console.log("depois volta vazia pra esse ano, mesmo que o ano tenha dado real). Em CADA aba, troque um filtro");
  console.log("(ex.: Ano escolar) e também alterne entre 'Participação e desempenho' e 'Acerto por habilidade'");
  console.log("na tabela de baixo, pra capturar os diferentes tipos de indicador que a tela usa.");
  await ask("\nQuando tiver passado pelas 3 abas de ano, pressione [ENTER] para continuar...");

  console.log("\nCapturando templates de requisição e código do município...");
  const templates = await capturarTemplates(browserContext);
  console.log(`${templates.length} template(s) de requisição distintos capturados. Código do município: ${templates[0]!.codigoMunicipio}`);

  // A varredura em si roda a partir de uma página do CAEd (não qualquer
  // aba) — `credentials: "same-origin"` só anexa os cookies de sessão
  // quando a página que chama o fetch está na mesma origem do CAEd.
  const paginaCaed = browserContext.pages().find((p) => p.url().includes("caeddigital.net"));
  if (paginaCaed) page = paginaCaed;

  const combinacoes = Object.entries(CICLOS_POR_ANO).flatMap(([ano, ciclos]) =>
    ciclos.flatMap((ciclo) => CAED_ANOS_ESCOLARES.map((a) => a.valor).flatMap((anoEtapa) => DISCIPLINAS.map((disciplina) => ({ ano, ciclo, anoEtapa, disciplina })))),
  );

  console.log(`\nVarrendo ${combinacoes.length} combinações × ${templates.length} template(s) de indicador...`);
  console.log("Combinações sem aplicação voltam vazias — isso é esperado, não é erro.\n");

  let totalRegistros = 0;
  let amostraImpressa = false;
  for (const { ciclo, anoEtapa, disciplina } of combinacoes) {
    const anoEscolarCodigo = anoEtapaParaCodigo(anoEtapa);
    const componente = disciplinaParaComponente(disciplina);
    const chave = `${ciclo} | ${anoEtapa} | ${disciplina}`;
    let registrosDaCombinacao = 0;

    for (const [indiceTemplate, { base, codigoMunicipio }] of templates.entries()) {
      try {
        const registros = await buscarCombinacaoEscola(page, base, codigoMunicipio, ciclo, anoEtapa, disciplina);
        for (const registro of registros) {
          fs.appendFileSync(
            ARQUIVO_SAIDA_BRUTO,
            JSON.stringify({ ciclo, anoEscolar: anoEscolarCodigo, componente, templateIndice: indiceTemplate, registro }) + "\n",
            "utf8",
          );
        }
        registrosDaCombinacao += registros.length;
        if (!amostraImpressa && registros.length > 0) {
          amostraImpressa = true;
          console.log("\n--- Amostra do primeiro registro devolvido pela API (nível escola) ---");
          console.log(JSON.stringify(registros[0], null, 2));
          console.log("--- fim da amostra ---\n");
        }
      } catch (err) {
        console.log(`${chave} [template ${indiceTemplate}]: erro — ${err instanceof Error ? err.message : String(err)}`);
      }
      await page.waitForTimeout(300);
    }

    if (registrosDaCombinacao > 0) {
      console.log(`${chave}: ${registrosDaCombinacao} registro(s) brutos gravados`);
      totalRegistros += registrosDaCombinacao;
    }
  }

  console.log(`\nTotal: ${totalRegistros} registros brutos salvos em ${ARQUIVO_SAIDA_BRUTO}`);
  console.log("Próximo passo: npx tsx scripts/mapear-caed-escolas.ts");

  const rodarMapeamento = (await ask("\nRodar o mapeamento agora? (s/N): ")).trim().toLowerCase();
  if (rodarMapeamento === "s") {
    try {
      execSync(`npx tsx scripts/mapear-caed-escolas.ts`, { stdio: "inherit" });
    } catch (err) {
      console.error("Erro ao executar mapeamento:", err);
    }
  }

  rl.close();
  await browserContext.close();
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
