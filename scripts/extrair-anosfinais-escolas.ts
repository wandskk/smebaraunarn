import { chromium, type BrowserContext, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { execSync } from "node:child_process";
import { ANOS_FINAIS_ANOS_ESCOLARES, ANOS_FINAIS_CICLOS_POR_ANO } from "../lib/anos-finais-catalogo";

/**
 * Extrai o agregado por ESCOLA (participação, defasagem/intermediário/
 * adequado, acerto por habilidade) do portal "Avaliação e Acompanhamento das
 * Aprendizagens nos Anos Finais" (MEC/CAEd — Pacto Nacional pela
 * Recomposição das Aprendizagens), via `portal/functions/getDadosResultado`.
 *
 * É a MESMA plataforma técnica do Criança Alfabetizada
 * (`scripts/extrair-caed-escolas.ts`) — confirmado em 2026-09-11 navegando
 * logado: mesmo endpoint, mesmo formato de requisição/resposta, tela de
 * login com a opção "Entrar com usuário do CAEd", rodapé "© CAEd UFJF".
 * Domínio, catálogo de etapas (6º-9º ano) e componentes (Ciências da
 * Natureza no lugar de Fluência) são diferentes — por isso este é um script
 * PRÓPRIO, não um parâmetro a mais em `extrair-caed-escolas.ts`: os dois
 * fluxos (extração, captura bruta, sessão de navegador, arquivo de saída)
 * ficam completamente separados dos Anos Iniciais/CAEd, por decisão
 * explícita — nunca misturar as duas fontes.
 *
 * Mesma técnica de captura BRUTA de `extrair-caed-escolas.ts`: grava cada
 * registro devolvido pela API sem interpretar nenhum campo — quem interpreta
 * é `scripts/mapear-anosfinais-escolas.ts` (roda offline, sem precisar
 * login de novo). Cobre TODAS as combinações de ano/ciclo/etapa/componente —
 * nenhuma é pulada, pra não perder nenhum dado disponível na plataforma.
 *
 * Uso:
 *   npx tsx scripts/extrair-anosfinais-escolas.ts
 *   npx tsx scripts/extrair-anosfinais-escolas.ts --cdp   (conecta num Chrome já aberto com --remote-debugging-port=9222)
 */

const ARQUIVO_SAIDA_BRUTO = path.join(process.cwd(), "scripts", "anosfinais_dados_escolas_raw.jsonl");
const DIRETORIO_SESSAO = path.join(process.cwd(), ".anosfinais_session");
const URL_BASE = "https://avaliacaoaprendizagensanosfinais.mec.gov.br";
const URL_API = `${URL_BASE}/portal/functions/getDadosResultado`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (pergunta: string) => new Promise<string>((resolve) => rl.question(pergunta, resolve));

/** Confirmado em 2026-09-11: sem Fluência (isso é só dos anos iniciais/alfabetização) — no lugar entra Ciências da Natureza. */
const DISCIPLINAS = ["LÍNGUA PORTUGUESA", "ESCRITA", "MATEMÁTICA", "CIÊNCIAS DA NATUREZA"] as const;

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

/** Não sabemos de antemão os nomes exatos dos campos em nível de escola — captura tudo, sem tipar (mesmo motivo de `extrair-caed-escolas.ts`). */
type RegistroApiBruto = Record<string, unknown> & { DC_HIERARQUIA?: string };

function disciplinaParaComponente(disciplina: (typeof DISCIPLINAS)[number]): string {
  switch (disciplina) {
    case "LÍNGUA PORTUGUESA":
      return "LP_LEITURA";
    case "ESCRITA":
      return "LP_ESCRITA";
    case "MATEMÁTICA":
      return "MATEMATICA";
    case "CIÊNCIAS DA NATUREZA":
      return "CIENCIAS_NATUREZA";
  }
}

function anoEtapaParaCodigo(etapa: string): string {
  const item = ANOS_FINAIS_ANOS_ESCOLARES.find((a) => a.valor === etapa);
  if (!item) throw new Error(`Ano escolar sem mapeamento: ${etapa}`);
  const numero = item.valor.match(/(\d)º ANO/)![1];
  return `${numero}ANO`;
}

/** Mesma técnica de `extrair-caed-escolas.ts`, mas guarda TODAS as chamadas distintas (não só a última) em `window.__todasBasesAnosFinais`. */
async function instalarInterceptador(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __todasBasesAnosFinais?: { requestBody: string; responseText: string }[] };
    if ((window as unknown as { __xhrPatchedAnosFinais?: boolean }).__xhrPatchedAnosFinais) return;
    (window as unknown as { __xhrPatchedAnosFinais: boolean }).__xhrPatchedAnosFinais = true;
    w.__todasBasesAnosFinais = w.__todasBasesAnosFinais ?? [];
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
          w.__todasBasesAnosFinais!.push({ requestBody: String(body ?? ""), responseText: this.responseText });
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

/** Deduplica por assinatura de `CD_INDICADOR` — lê de TODAS as abas abertas no contexto (mesmo racional de `extrair-caed-escolas.ts`). */
async function capturarTemplates(browserContext: BrowserContext): Promise<TemplateCapturado[]> {
  const paginas = browserContext.pages();
  const porPagina = await Promise.all(
    paginas.map((p) =>
      p
        .evaluate(() => (window as unknown as { __todasBasesAnosFinais?: { requestBody: string; responseText: string }[] }).__todasBasesAnosFinais ?? [])
        .catch(() => []),
    ),
  );
  const capturadas = porPagina.flat();
  if (capturadas.length === 0) {
    const urls = paginas.map((p) => p.url()).join(", ") || "(nenhuma aba aberta)";
    throw new Error(
      `Nenhuma chamada à API foi capturada ainda em nenhuma aba (abas abertas: ${urls}). ` +
        "Confirme que está navegando na tela de Resultados e trocou algum filtro antes de continuar.",
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
      // resposta que não é desse formato — ignora
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
  console.log("\n===========================================================================");
  console.log("   Extrator Anos Finais (MEC/CAEd) — agregado por ESCOLA via API direta   ");
  console.log("===========================================================================\n");

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
    console.log(`Abrindo navegador (${executavel ? "Google Chrome" : "Chromium"}) com perfil persistente (.anosfinais_session)...`);
    browserContext = await chromium.launchPersistentContext(DIRETORIO_SESSAO, {
      executablePath: executavel,
      headless: false,
      viewport: { width: 1280, height: 800 },
      args: ["--start-maximized"],
    });
    page = browserContext.pages()[0] ?? (await browserContext.newPage());
    // Nunca abrir direto em VIEW_RESULTADOS: essa rota exige sessão autenticada e
    // devolve "Você não tem permissão para acessar essa página" pra qualquer
    // visita a frio (confirmado em 2026-09-11) — precisa entrar pela home e logar
    // primeiro, só então navegar até Resultados pelo menu.
    await page.goto(`${URL_BASE}/#!/inicio`);
  }

  for (const p of browserContext.pages()) {
    await instalarInterceptador(p);
    p.on("framenavigated", () => instalarInterceptador(p).catch(() => {}));
  }
  browserContext.on("page", (novaPagina) => {
    instalarInterceptador(novaPagina).catch(() => {});
    novaPagina.on("framenavigated", () => instalarInterceptador(novaPagina).catch(() => {}));
  });

  console.log("\nClique em 'ENTRAR' e faça login (gov.br, ou 'Entrar com usuário do CAEd').");
  console.log("Depois de logado, use o menu para ir até a seção 'Resultados' das avaliações.");
  console.log("IMPORTANTE: clique em CADA UMA das abas 'Resultados 2026' / 'Resultados 2025' / 'Resultados 2024'");
  console.log("(o código do indicador que a API usa muda de ano pra ano). Em CADA aba, troque um filtro (ex.: Ano");
  console.log("escolar) e também alterne entre 'Participação e desempenho' e 'Acerto por habilidade' na tabela de");
  console.log("baixo, pra capturar os diferentes tipos de indicador que a tela usa.");
  await ask("\nQuando tiver passado pelas 3 abas de ano, pressione [ENTER] para continuar...");

  console.log("\nCapturando templates de requisição e código do município...");
  const templates = await capturarTemplates(browserContext);
  console.log(`${templates.length} template(s) de requisição distintos capturados. Código do município: ${templates[0]!.codigoMunicipio}`);

  const paginaAnosFinais = browserContext.pages().find((p) => p.url().includes("avaliacaoaprendizagensanosfinais.mec.gov.br"));
  if (paginaAnosFinais) page = paginaAnosFinais;

  // Cobre TODAS as combinações de ano/ciclo × etapa × componente — nenhuma é pulada.
  const combinacoes = Object.entries(ANOS_FINAIS_CICLOS_POR_ANO).flatMap(([ano, codigosCiclo]) =>
    codigosCiclo.flatMap((codigoCiclo) =>
      ANOS_FINAIS_ANOS_ESCOLARES.map((a) => a.valor).flatMap((anoEtapa) =>
        DISCIPLINAS.map((disciplina) => ({ ano, ciclo: `${codigoCiclo}${ano}`, anoEtapa, disciplina })),
      ),
    ),
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
  console.log("Próximo passo: npx tsx scripts/mapear-anosfinais-escolas.ts");

  const rodarMapeamento = (await ask("\nRodar o mapeamento agora? (s/N): ")).trim().toLowerCase();
  if (rodarMapeamento === "s") {
    try {
      execSync(`npx tsx scripts/mapear-anosfinais-escolas.ts`, { stdio: "inherit" });
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
