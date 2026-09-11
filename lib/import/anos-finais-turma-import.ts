import { prisma } from "@/lib/prisma";
import type { LinhaTabular } from "./parse-tabular";
import type { AnosFinaisCodigoCiclo, AnosFinaisNomeCiclo } from "@/lib/anos-finais-catalogo";
import { extrairCodigoInep, parsePercent, parseInteiro, extrairAcertoPorHabilidade } from "./caed-turma-import";

/**
 * Importação em lote dos indicadores agregados por escola/turma do portal
 * "Avaliação e Acompanhamento das Aprendizagens nos Anos Finais" (MEC/CAEd —
 * Pacto Nacional pela Recomposição das Aprendizagens).
 *
 * Deliberadamente PARALELO a `caed-turma-import.ts`, não uma extensão dele:
 * mesma plataforma técnica (CAEd/UFJF) do Criança Alfabetizada, mas fonte,
 * catálogo (etapas 6º-9º, componente "Ciências da Natureza" em vez de
 * "Fluência") e ciclo de vida de dados diferentes — CAEd anos iniciais e
 * Anos Finais devem ficar separados: `Avaliacao.tipo` distinto
 * (`AVALIACAO_CONTINUA_ANOS_FINAIS`) e prefixo de código distinto
 * (`ANOSFINAIS-` em vez de `CAED-`), pra nunca colidir nem se confundir na
 * consulta. Só reaproveita os parsers puros de `caed-turma-import.ts`
 * (extração de código INEP, percentual, inteiro, acerto por habilidade) —
 * esses não têm nada de específico do CAEd, são só parsing de texto.
 */

export interface FiltroAnosFinais {
  codigoCiclo: AnosFinaisCodigoCiclo;
  nomeCiclo: AnosFinaisNomeCiclo;
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

/** Valida + resolve as linhas extraídas da API dos Anos Finais, conferindo contra o filtro selecionado (mesma lógica de conferência do CAEd, arquivo à parte por design). */
export async function validarLinhasResultadoTurmaAnosFinais(linhas: LinhaTabular[], filtro: FiltroAnosFinais): Promise<ResultadoTurmaImportado[]> {
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
        anoEscolarDivergente && `Fonte traz ano escolar "${anoEscolarCsv}", mas o filtro selecionado foi "${filtro.anoEscolarValor}".`,
        redeDivergente && `Fonte traz rede "${redeCsv}", mas o filtro selecionado foi "${filtro.redeValor}".`,
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
function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Encontra (ou cria) a `Avaliacao` correspondente ao filtro selecionado.
 * Prefixo `ANOSFINAIS-` (nunca `CAED-`) e `tipo: AVALIACAO_CONTINUA_ANOS_FINAIS`
 * garantem que nenhum código colida com uma avaliação do Criança
 * Alfabetizada, mesmo que ciclo/ano coincidam.
 */
async function resolverOuCriarAvaliacao(filtro: FiltroAnosFinais) {
  const codigo = `ANOSFINAIS-${filtro.codigoCiclo}${filtro.ano}-${slug(filtro.anoEscolarValor)}-${filtro.componenteSlug}`;

  const existente = await prisma.avaliacao.findUnique({ where: { codigo } });
  if (existente) return existente;

  return prisma.avaliacao.create({
    data: {
      codigo,
      nome: `Avaliação Contínua da Aprendizagem nos Anos Finais — ${filtro.nomeCiclo} ${filtro.ano} — ${filtro.anoEscolarValor} — ${filtro.componenteLabel}`,
      descricao: `Importado do portal Avaliação e Acompanhamento das Aprendizagens nos Anos Finais (MEC/CAEd). Rede: ${filtro.redeValor}. Componente curricular: ${filtro.componenteLabel}.`,
      tipo: "AVALIACAO_CONTINUA_ANOS_FINAIS",
      ano: filtro.ano,
      etapaEnsino: filtro.anoEscolarValor,
    },
  });
}

/** Grava (upsert) as linhas com status "ok" contra a `Avaliacao` do filtro selecionado. */
export async function commitResultadosTurmaImportadosAnosFinais(filtro: FiltroAnosFinais, linhas: ResultadoTurmaImportado[]): Promise<number> {
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
