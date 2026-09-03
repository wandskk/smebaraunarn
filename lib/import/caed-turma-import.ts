import { prisma } from "@/lib/prisma";
import type { LinhaTabular } from "./parse-tabular";
import type { CaedCodigoCiclo, CaedNomeCiclo } from "@/lib/caed-catalogo";

/**
 * Importação em lote dos indicadores agregados por turma/escola do portal
 * Criança Alfabetizada (CAEd/UFJF) — Avaliação Contínua da Aprendizagem.
 * Casa a escola pelo código INEP embutido no texto da coluna/campo "Escola"
 * (ex.: "ESCOLA MUNICIPAL ... - 24000531"). Duas fontes alimentam o mesmo
 * pipeline (`validarLinhasResultadoTurma`/`commitResultadosTurmaImportados`):
 * o upload manual de CSV em `app/admin/avaliacoes/caed/importar`, e o
 * extrator via API em `scripts/extrair-caed-escolas.ts` +
 * `scripts/importar-caed-escola.ts` — este último não usa CSV, só monta o
 * mesmo formato `LinhaTabular` a partir da resposta da API.
 *
 * O filtro (ciclo/ano/ano escolar/componente/rede) é sempre selecionado
 * explicitamente por quem chama, não lido da fonte: o CSV exportado pelo
 * site só marca "LÍNGUA PORTUGUESA" tanto para Leitura quanto pra Escrita —
 * não dá pra distinguir as duas só pelo conteúdo. Ano escolar e Rede da
 * fonte são usados apenas para conferência (linha sinalizada se não bater
 * com o filtro selecionado).
 *
 * Mesmo padrão de `avaliacoes-import.ts`: validação/resolução sem gravar
 * nada (usada no preview), reaproveitada tal-e-qual no commit.
 */

export interface FiltroCaed {
  codigoCiclo: CaedCodigoCiclo;
  nomeCiclo: CaedNomeCiclo;
  ano: number;
  anoEscolarValor: string;
  componenteSlug: string;
  componenteLabel: string;
  redeValor: string;
}

export type StatusResultadoTurmaImportado = "ok" | "escola_nao_encontrada" | "combinacao_diferente" | "erro_dado";

export interface ResultadoTurmaImportado {
  linha: number;
  anoEscolarCsv: string | null;
  redeCsv: string | null;
  escolaTexto: string;
  escolaId: number | null;
  turma: string | null;
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
  status: StatusResultadoTurmaImportado;
  detalhe: string | null;
}

const REGEX_CODIGO_INEP = /-\s*(\d{6,8})\s*$/;

/** Extrai o código INEP embutido no fim do texto da coluna "Escola" do CSV (ex.: "ESCOLA ... - 24000531"). */
export function extrairCodigoInep(escolaTexto: string): string | null {
  const match = escolaTexto.match(REGEX_CODIGO_INEP);
  return match ? match[1]! : null;
}

/** Converte texto de percentual ("45,2%", "45.2", "") em número — null quando vazio ou não numérico. */
export function parsePercent(texto: string | undefined): number | null {
  if (!texto) return null;
  const limpo = texto.trim().replace("%", "").replace(",", ".");
  if (limpo === "") return null;
  const valor = Number(limpo);
  return Number.isNaN(valor) ? null : valor;
}

/** Converte texto de contagem absoluta ("76", "76.0") em inteiro — null quando vazio ou não numérico. */
export function parseInteiro(texto: string | undefined): number | null {
  if (!texto) return null;
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return null;
  const valor = Number(limpo);
  return Number.isNaN(valor) ? null : Math.round(valor);
}

/** Colunas "H 01 (%)".."H NN (%)" viram chaves normalizadas "h_01_(%)" etc. */
export function extrairAcertoPorHabilidade(linha: LinhaTabular): Record<string, number> | null {
  const resultado: Record<string, number> = {};
  for (const [chave, valor] of Object.entries(linha)) {
    const match = chave.match(/^h_(\d+)_/);
    if (!match) continue;
    const percentual = parsePercent(valor);
    if (percentual !== null) resultado[`H${match[1]!.padStart(2, "0")}`] = percentual;
  }
  return Object.keys(resultado).length > 0 ? resultado : null;
}

/**
 * Valida + resolve todas as linhas de um CSV "Habilidade, Participação e
 * Desempenho - Turma" baixado do CAEd, conferindo contra o filtro que o
 * usuário selecionou (ano escolar/rede) — não confia no conteúdo do
 * arquivo para essas duas colunas, só usa pra sinalizar divergência.
 */
export async function validarLinhasResultadoTurma(linhas: LinhaTabular[], filtro: FiltroCaed): Promise<ResultadoTurmaImportado[]> {
  const resultado: ResultadoTurmaImportado[] = [];

  for (const [indice, linha] of linhas.entries()) {
    const escolaTexto = (linha.escola ?? "").trim();
    const turma = (linha.turma ?? "").trim() || null;
    const anoEscolarCsv = (linha.ano_escolar ?? "").trim() || null;
    const redeCsv = (linha.rede ?? "").trim() || null;

    const codigoInep = escolaTexto ? extrairCodigoInep(escolaTexto) : null;
    let escolaId: number | null = null;
    if (codigoInep) {
      const escola = await prisma.escola.findFirst({ where: { codigoInep }, select: { id: true } });
      escolaId = escola?.id ?? null;
    }

    const previstos = parseInteiro(linha.previstos);
    const avaliados = parseInteiro(linha.avaliados);
    const percentualParticipacao = parsePercent(linha["avaliados_(%)"]);
    const percentualDefasagem = parsePercent(linha.defasagem);
    const percentualIntermediario = parsePercent(linha.aprendizado_intermediario);
    const percentualAdequado = parsePercent(linha.aprendizado_adequado);
    const quantidadeDefasagem = parseInteiro(linha.quantidade_defasagem);
    const quantidadeIntermediario = parseInteiro(linha.quantidade_intermediario);
    const quantidadeAdequado = parseInteiro(linha.quantidade_adequado);
    const acertoPorHabilidade = extrairAcertoPorHabilidade(linha);

    const anoEscolarDivergente = !!anoEscolarCsv && anoEscolarCsv.toUpperCase() !== filtro.anoEscolarValor.toUpperCase();
    const redeDivergente = !!redeCsv && filtro.redeValor !== "PUBLICA" && redeCsv.toUpperCase() !== filtro.redeValor.toUpperCase();

    let status: StatusResultadoTurmaImportado;
    let detalhe: string | null = null;

    if (!escolaTexto || !turma) {
      status = "erro_dado";
      detalhe = "Linha sem escola ou turma.";
    } else if (!codigoInep) {
      status = "erro_dado";
      detalhe = `Não foi possível extrair o código INEP do texto da escola ("${escolaTexto}").`;
    } else if (!escolaId) {
      status = "escola_nao_encontrada";
      detalhe = `Nenhuma escola cadastrada com código INEP ${codigoInep}.`;
    } else if (anoEscolarDivergente || redeDivergente) {
      status = "combinacao_diferente";
      detalhe = [
        anoEscolarDivergente && `CSV traz ano escolar "${anoEscolarCsv}", mas o filtro selecionado foi "${filtro.anoEscolarValor}".`,
        redeDivergente && `CSV traz rede "${redeCsv}", mas o filtro selecionado foi "${filtro.redeValor}".`,
      ]
        .filter(Boolean)
        .join(" ");
    } else if (percentualParticipacao === null || percentualParticipacao === 0) {
      status = "erro_dado";
      detalhe = "Turma sem estudantes avaliados nesta rodada.";
    } else {
      status = "ok";
    }

    resultado.push({
      linha: indice + 1,
      anoEscolarCsv,
      redeCsv,
      escolaTexto,
      escolaId,
      turma,
      previstos,
      avaliados,
      percentualParticipacao,
      percentualDefasagem,
      percentualIntermediario,
      percentualAdequado,
      quantidadeDefasagem,
      quantidadeIntermediario,
      quantidadeAdequado,
      acertoPorHabilidade,
      status,
      detalhe,
    });
  }

  return resultado;
}

/** Normaliza texto livre em um slug ASCII maiúsculo (usado no código da `Avaliacao` gerada). */
export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Encontra (ou cria) a `Avaliacao` correspondente ao filtro selecionado
 * (ciclo × ano escolar × componente). Evita exigir que o admin
 * pré-cadastre manualmente as até 20 avaliações por ciclo antes de
 * importar.
 */
async function resolverOuCriarAvaliacao(filtro: FiltroCaed) {
  const codigo = `CAED-${filtro.codigoCiclo}${filtro.ano}-${slug(filtro.anoEscolarValor)}-${filtro.componenteSlug}`;

  const existente = await prisma.avaliacao.findUnique({ where: { codigo } });
  if (existente) return existente;

  return prisma.avaliacao.create({
    data: {
      codigo,
      nome: `Avaliação Contínua da Aprendizagem — ${filtro.nomeCiclo} ${filtro.ano} — ${filtro.anoEscolarValor} — ${filtro.componenteLabel}`,
      descricao: `Importado do portal Criança Alfabetizada (CAEd/UFJF). Rede: ${filtro.redeValor}. Componente curricular: ${filtro.componenteLabel}.`,
      tipo: "AVALIACAO_CONTINUA_CAED",
      ano: filtro.ano,
      etapaEnsino: filtro.anoEscolarValor,
    },
  });
}

/**
 * Grava (upsert) as linhas com status "ok" contra a `Avaliacao` do filtro
 * selecionado — um único filtro determina uma única avaliação, resolvida
 * uma vez só (não por linha).
 */
export async function commitResultadosTurmaImportados(filtro: FiltroCaed, linhas: ResultadoTurmaImportado[]): Promise<number> {
  const validas = linhas.filter((l) => l.status === "ok" && l.escolaId !== null && l.turma !== null);
  if (validas.length === 0) return 0;

  const avaliacao = await resolverOuCriarAvaliacao(filtro);
  let gravados = 0;

  for (const linha of validas) {
    await prisma.avaliacaoResultadoTurma.upsert({
      where: { avaliacaoId_escolaId_turma: { avaliacaoId: avaliacao.id, escolaId: linha.escolaId!, turma: linha.turma! } },
      update: {
        previstos: linha.previstos,
        avaliados: linha.avaliados,
        percentualParticipacao: linha.percentualParticipacao,
        percentualDefasagem: linha.percentualDefasagem,
        percentualIntermediario: linha.percentualIntermediario,
        percentualAdequado: linha.percentualAdequado,
        quantidadeDefasagem: linha.quantidadeDefasagem,
        quantidadeIntermediario: linha.quantidadeIntermediario,
        quantidadeAdequado: linha.quantidadeAdequado,
        ...(linha.acertoPorHabilidade ? { acertoPorHabilidade: linha.acertoPorHabilidade } : {}),
      },
      create: {
        avaliacaoId: avaliacao.id,
        escolaId: linha.escolaId!,
        turma: linha.turma!,
        previstos: linha.previstos,
        avaliados: linha.avaliados,
        percentualParticipacao: linha.percentualParticipacao,
        percentualDefasagem: linha.percentualDefasagem,
        percentualIntermediario: linha.percentualIntermediario,
        percentualAdequado: linha.percentualAdequado,
        quantidadeDefasagem: linha.quantidadeDefasagem,
        quantidadeIntermediario: linha.quantidadeIntermediario,
        quantidadeAdequado: linha.quantidadeAdequado,
        acertoPorHabilidade: linha.acertoPorHabilidade ?? undefined,
      },
    });
    gravados++;
  }

  return gravados;
}
