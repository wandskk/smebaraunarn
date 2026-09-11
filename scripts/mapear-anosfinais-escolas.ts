import { readFileSync, writeFileSync, existsSync } from "node:fs";
import * as path from "node:path";

/**
 * Fase 2 do fluxo de extração por escola dos Anos Finais (fase 1 =
 * `extrair-anosfinais-escolas.ts`): lê a captura BRUTA da API
 * (`anosfinais_dados_escolas_raw.jsonl`) e produz `anosfinais_dados_escolas.jsonl`
 * no formato que `scripts/importar-anosfinais-escola.ts` espera.
 *
 * Espelha `scripts/mapear-caed-escolas.ts` (mesma plataforma técnica,
 * mesmos nomes de campo confirmados na API) — arquivo à parte, não uma
 * opção a mais no mapeador do CAEd, pelo mesmo motivo de separação
 * documentado em `extrair-anosfinais-escolas.ts`. Roda 100% offline.
 *
 * Nomes de campo confirmados contra uma resposta real da API em 2026-09-11:
 *   QT_PREVISTO / QT_EFETIVO           → previstos / avaliados
 *   TX_PARTICIPACAO                    → % participação
 *   TX_N01/N02/N03                     → % Defasagem/Intermediário/Adequado
 *   NU_N01/N02/N03                     → contagem real de estudante em cada nível
 *   TX_ACERTO_HABILIDADE_<n>           → % de acerto da habilidade Hn
 *
 * Diferença notada em relação ao CAEd anos iniciais: a resposta aqui também
 * trouxe TX_N04/NU_N04 (um 4º nível) e TX_G01-G03/NU_G01-G03 — mas a tela de
 * Resultados (conferida ao vivo para LP/Matemática) segue mostrando só 3
 * categorias (Defasagem/Aprendizado intermediário/Aprendizado adequado),
 * igual ao CAEd. Por ora N04/G01-G03 ficam em CAMPOS_IGNORADOS (não
 * descartados de verdade — o .jsonl bruto sempre guarda o registro inteiro,
 * só não entram no agregado de 3 níveis) até confirmarmos o que representam.
 */

const ARQUIVO_ENTRADA = path.join(process.cwd(), "scripts", "anosfinais_dados_escolas_raw.jsonl");
const ARQUIVO_SAIDA = path.join(process.cwd(), "scripts", "anosfinais_dados_escolas.jsonl");

interface LinhaBruta {
  ciclo: string;
  anoEscolar: string;
  componente: string;
  templateIndice: number;
  registro: Record<string, unknown>;
}

interface RegistroEscolaBruto {
  ciclo: string;
  ano: number;
  anoEscolar: string;
  componente: string;
  escolaCodigo: string;
  escolaNome: string | null;
  previstos: number | null;
  avaliados: number | null;
  percentualParticipacao: number | null;
  percentualDefasagem: number | null;
  percentualIntermediario: number | null;
  percentualAdequado: number | null;
  quantidadeDefasagem: number | null;
  quantidadeIntermediario: number | null;
  quantidadeAdequado: number | null;
  acertoPorHabilidade: Record<string, number> | null;
}

type CampoNumerico = Exclude<keyof RegistroEscolaBruto, "ciclo" | "ano" | "anoEscolar" | "componente" | "escolaCodigo" | "escolaNome" | "acertoPorHabilidade">;

const CAMPO_EXATO: Record<string, CampoNumerico> = {
  QT_PREVISTO: "previstos",
  QT_EFETIVO: "avaliados",
  TX_PARTICIPACAO: "percentualParticipacao",
  TX_N01: "percentualDefasagem",
  TX_N02: "percentualIntermediario",
  TX_N03: "percentualAdequado",
  NU_N01: "quantidadeDefasagem",
  NU_N02: "quantidadeIntermediario",
  NU_N03: "quantidadeAdequado",
};

function paraNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "string") {
    const limpo = valor.trim().replace("%", "").replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** `ciclo` vem como "AV12026" (código+ano grudados) — separa em código curto ("AV1") e ano (2026). */
function separarCicloAno(ciclo: string): { codigoCiclo: string; ano: number } {
  const match = ciclo.match(/^(AV\d)(\d{4})$/);
  if (!match) throw new Error(`Formato de ciclo inesperado: ${ciclo}`);
  return { codigoCiclo: match[1]!, ano: Number(match[2]) };
}

const PADRAO_HABILIDADE = /^H0*(\d+)$|HABILIDADE[_-]?0*(\d+)/i;

/** Campos puramente identificadores/metadados, e os ainda não confirmados (N04, G01-G03 — ver nota no topo do arquivo). */
const CAMPOS_IGNORADOS = new Set([
  "NM_ENTIDADE",
  "DC_HIERARQUIA",
  "FL_PARTICIPACAO",
  "_id",
  "executionId",
  "persistDate",
  "CD_INDICADOR",
  "CD_PROGRAMA_REGISTRO",
  "CD_REGISTRO_CAED",
  "CD_ENTIDADE",
  "CD_ENTIDADE_SUPERIOR",
  "TP_ENTIDADE",
  "DC_TIPO_ENTIDADE",
  "CD_PESQUISA_AVALIACAO",
  "VL_FILTRO_DISCIPLINA",
  "VL_FILTRO_ETAPA",
  "VL_FILTRO_REDE",
  "VL_FILTRO_AVALIACAO",
  "CD_PAIS",
  "NM_PAIS",
  "CD_ESTADO",
  "NM_ESTADO",
  "CD_MUNICIPIO",
  "NM_MUNICIPIO",
  "CD_REGIONAL",
  "NM_REGIONAL",
  "CD_INSTITUICAO",
  "NM_INSTITUICAO",
  "NU_MODELO_CADERNO",
  // agregados em nível de escola/estado (todos os componentes juntos, ou a rede inteira) — não é o que essa combinação ciclo/etapa/componente representa.
  "TX_PARTICIPACAO_ESCOLA",
  "TX_PARTICIPACAO_ESTADO",
  "DC_ATIVIDADES",
  "DC_ATIVIDADES_ESCOLA",
  "DC_ACERTOS",
  "DC_ACERTOS_ESCOLA",
  "DC_ACERTOS_ESTADO",
  "TX_ACERTOS",
  "TX_ACERTO",
  // 4º nível visto na API (Matemática/7º ano, 2026-09-11) — tela de Resultados segue mostrando só 3 categorias; fora do agregado até confirmarmos o que representa.
  "NU_N04",
  "TX_N04",
  // taxonomia paralela vista tanto aqui quanto em combinações antigas do CAEd (2024) — não sabemos ao certo o que significa.
  "NU_APRENDIZAGEM_1",
  "NU_APRENDIZAGEM_2",
  "NU_APRENDIZAGEM_3",
  "TX_G01",
  "TX_G02",
  "TX_G03",
  "NU_G01",
  "NU_G02",
  "NU_G03",
  // escala de 6 níveis (TCT) — fora de escopo por ora.
  "NU_N01_TCT",
  "NU_N02_TCT",
  "NU_N03_TCT",
  "NU_N04_TCT",
  "NU_N05_TCT",
  "NU_N06_TCT",
  "TX_N01_TCT",
  "TX_N02_TCT",
  "TX_N03_TCT",
  "TX_N04_TCT",
  "TX_N05_TCT",
  "TX_N06_TCT",
  // sub-níveis dentro de N01 — não confirmado, fora de escopo por ora.
  "NU_N01_01",
  "NU_N01_02",
  "NU_N01_03",
  "NU_N01_04",
  "NU_N01_05",
  "NU_N01_06",
  "TX_N01_01",
  "TX_N01_02",
  "TX_N01_03",
  "TX_N01_04",
  "TX_N01_05",
  "TX_N01_06",
  // métricas específicas de Fluência/Escrita — não se aplicam aos Anos Finais, mas mantidas por segurança caso a API reutilize os mesmos nomes.
  "TX_PRECISAO_TEXTO",
  "TX_PRECISAO_TEXTO_N01",
  "TX_PRECISAO_TEXTO_N02",
  "TX_PRECISAO_TEXTO_N03",
  "TX_COMPEENSAO_TEXTO",
  "TX_COMPEENSAO_TEXTO_N01",
  "TX_COMPEENSAO_TEXTO_N02",
  "TX_COMPEENSAO_TEXTO_N03",
  "NU_SEMINFORMACAO",
  "TX_SEMINFORMACAO",
  "VL_NOTA",
]);

const PADRAO_ASPECTO_ESCRITA = /^VL_Q\d+_ASPECTO_\d+(_[A-Z])?$/;
const SUFIXO_AGREGADO_MAIOR = /_(ESCOLA|ESTADO|REGIAO|REGIONAL|MUNICIPIO|PAIS|NACIONAL)$/i;

function extrairCamposConhecidos(registro: Record<string, unknown>): {
  campos: Partial<Record<CampoNumerico, number>>;
  habilidades: { codigo: string; valor: number }[];
  naoReconhecidos: string[];
} {
  const campos: Partial<Record<CampoNumerico, number>> = {};
  const habilidades: { codigo: string; valor: number }[] = [];
  const naoReconhecidos: string[] = [];

  for (const [chave, valorBruto] of Object.entries(registro)) {
    if (CAMPOS_IGNORADOS.has(chave) || PADRAO_ASPECTO_ESCRITA.test(chave)) continue;
    const valor = paraNumero(valorBruto);
    if (valor === null) continue;

    const campoExato = CAMPO_EXATO[chave];
    if (campoExato) {
      campos[campoExato] = valor;
      continue;
    }

    const habMatch = chave.match(PADRAO_HABILIDADE);
    if (habMatch) {
      habilidades.push({ codigo: `H${(habMatch[1] ?? habMatch[2])!.padStart(2, "0")}`, valor });
      continue;
    }

    if (SUFIXO_AGREGADO_MAIOR.test(chave)) {
      naoReconhecidos.push(chave);
      continue;
    }

    if (/PREVIST/i.test(chave)) campos.previstos = valor;
    else if (/EFETIVO|^(QT_)?AVALIAD/i.test(chave) && !/PERCENT|_PCT|%/i.test(chave)) campos.avaliados = valor;
    else if (/^TX_PARTICIPACAO$/i.test(chave) || /PARTICIP/i.test(chave)) campos.percentualParticipacao = valor;
    else if (/DEFASAG/i.test(chave)) campos.percentualDefasagem = valor;
    else if (/INTERMEDI/i.test(chave)) campos.percentualIntermediario = valor;
    else if (/ADEQUAD/i.test(chave)) campos.percentualAdequado = valor;
    else naoReconhecidos.push(chave);
  }

  return { campos, habilidades, naoReconhecidos };
}

function main() {
  if (!existsSync(ARQUIVO_ENTRADA)) {
    console.error(`Arquivo não encontrado: ${ARQUIVO_ENTRADA}`);
    console.error("Rode antes: npx tsx scripts/extrair-anosfinais-escolas.ts");
    process.exit(1);
  }

  const linhas: LinhaBruta[] = readFileSync(ARQUIVO_ENTRADA, "utf-8")
    .trim()
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const porEscola = new Map<string, RegistroEscolaBruto>();
  const chavesNaoReconhecidas = new Set<string>();

  for (const linha of linhas) {
    const hierarquia = typeof linha.registro.DC_HIERARQUIA === "string" ? linha.registro.DC_HIERARQUIA : null;
    if (!hierarquia) continue;
    // DC_HIERARQUIA em nível de escola: "<nacional> / <uf> / <?> / <município> / <escola>"
    const escolaCodigo = hierarquia.split(" / ")[4];
    if (!escolaCodigo) continue;

    const { codigoCiclo, ano } = separarCicloAno(linha.ciclo);
    const chave = `${codigoCiclo}|${ano}|${linha.anoEscolar}|${linha.componente}|${escolaCodigo}`;

    const existente = porEscola.get(chave) ?? {
      ciclo: codigoCiclo,
      ano,
      anoEscolar: linha.anoEscolar,
      componente: linha.componente,
      escolaCodigo,
      escolaNome: typeof linha.registro.NM_ENTIDADE === "string" ? linha.registro.NM_ENTIDADE : null,
      previstos: null,
      avaliados: null,
      percentualParticipacao: null,
      percentualDefasagem: null,
      percentualIntermediario: null,
      percentualAdequado: null,
      quantidadeDefasagem: null,
      quantidadeIntermediario: null,
      quantidadeAdequado: null,
      acertoPorHabilidade: null,
    };

    const { campos, habilidades, naoReconhecidos } = extrairCamposConhecidos(linha.registro);
    naoReconhecidos.forEach((c) => chavesNaoReconhecidas.add(c));
    for (const [k, v] of Object.entries(campos) as [keyof typeof campos, number][]) {
      if (existente[k] === null || existente[k] === undefined) (existente as never as Record<string, number>)[k] = v;
    }
    if (habilidades.length > 0) {
      existente.acertoPorHabilidade = existente.acertoPorHabilidade ?? {};
      for (const h of habilidades) existente.acertoPorHabilidade[h.codigo] = h.valor;
    }

    porEscola.set(chave, existente);
  }

  const registros = Array.from(porEscola.values());
  writeFileSync(ARQUIVO_SAIDA, registros.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

  console.log(`${registros.length} registro(s) de escola mapeados a partir de ${linhas.length} linha(s) brutas.`);
  console.log(`Salvo em: ${ARQUIVO_SAIDA}`);
  console.log(`Próximo passo: npx tsx scripts/importar-anosfinais-escola.ts ${ARQUIVO_SAIDA}`);

  if (chavesNaoReconhecidas.size > 0) {
    console.log(`\nCampos vistos na resposta da API que este mapeador ainda NÃO reconhece (podem ser irrelevantes, ou podem ser`);
    console.log(`participação/previstos/avaliados/etc. com um nome diferente do esperado — vale checar):`);
    for (const c of chavesNaoReconhecidas) console.log(`  - ${c}`);
  }

  const semNenhumCampo = registros.filter(
    (r) => r.previstos === null && r.avaliados === null && r.percentualParticipacao === null && r.percentualDefasagem === null && !r.acertoPorHabilidade,
  );
  if (semNenhumCampo.length > 0) {
    console.log(`\n${semNenhumCampo.length} registro(s) de escola não tiveram NENHUM campo reconhecido — o mapeamento acima`);
    console.log(`provavelmente precisa de ajuste. Dê uma olhada num registro bruto de exemplo:`);
    console.log(JSON.stringify(linhas[0]?.registro, null, 2));
  }
}

main();
