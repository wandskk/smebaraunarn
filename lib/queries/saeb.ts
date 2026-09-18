/**
 * lib/queries/saeb.ts
 *
 * Funções de leitura dos dados SAEB importados do INEP.
 * Todas as funções são Server-side (Next.js Server Components / API Routes).
 */

import { prisma } from "@/lib/prisma";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SaebSerie = "5" | "9" | "12";
export type SaebComponente = "LP" | "MT";
export type SaebLocalizacao = "Total" | "Urbana" | "Rural";

/** Dependências administrativas normalizadas para uso nos filtros */
export const SAEB_DEP_MUNICIPAL = "Municipal";
export const SAEB_DEP_ESTADUAL = "Estadual";
export const SAEB_DEP_TOTAL = "Total - Federal, Estadual, Municipal e Privada";
export const SAEB_LOC_TOTAL = "Total";
export const SAEB_LOC_URBANA = "Urbana";
export const SAEB_LOC_RURAL = "Rural";

/** Ponto de uma série temporal — usado em HistoricalEvolutionChart */
export interface SaebEvolucaoPonto {
  ano: number;
  valor: number | null;
}

/** Distribuição de níveis de proficiência */
export interface SaebNivelDistribuicao {
  nivel: string;
  percentual: number;
}

/** Resultado de uma escola */
export interface SaebEscolaResumo {
  id: string;
  codigoInep: string;
  nomeEscola: string;
  rede: string;
  segmento: string;
  indicadorRend: Record<string, number> | null;
  aprovacoes: Record<string, number> | null;
  escolaId: number | null;
  /** Quantidade de alunos matriculados na escola (via SIGEduc) */
  totalAlunos: number | null;
}

// ─── Anos disponíveis ────────────────────────────────────────────────────────

/** Retorna os anos SAEB disponíveis no banco, em ordem crescente */
export async function getSaebAnos(): Promise<number[]> {
  const rows = await prisma.saebResultadoMunicipio.groupBy({
    by: ["anoSaeb"],
    orderBy: { anoSaeb: "asc" },
  });
  return rows.map((r) => r.anoSaeb);
}

// ─── Médias do município ──────────────────────────────────────────────────────

/** Médias de proficiência de um ano específico, para uma dependência e localização */
export async function getSaebMediasMunicipio(
  anoSaeb: number,
  dependenciaAdm = SAEB_DEP_TOTAL,
  localizacao = SAEB_LOC_TOTAL
) {
  return prisma.saebResultadoMunicipio.findUnique({
    where: { anoSaeb_dependenciaAdm_localizacao: { anoSaeb, dependenciaAdm, localizacao } },
  });
}

/** Retorna todos os registros de um ano (todas as dependências e localizações) */
export async function getSaebMunicipioAno(anoSaeb: number) {
  return prisma.saebResultadoMunicipio.findMany({
    where: { anoSaeb },
    orderBy: [{ dependenciaAdm: "asc" }, { localizacao: "asc" }],
  });
}

// ─── Evolução temporal ────────────────────────────────────────────────────────

/**
 * Evolução de uma métrica ao longo dos anos — usada em HistoricalEvolutionChart.
 * @param serie "5" | "9" | "12"
 * @param componente "LP" | "MT"
 * @param dependenciaAdm filtra por dependência
 * @param localizacao filtra por localização
 */
export async function getSaebEvolucaoTemporal(
  serie: SaebSerie,
  componente: SaebComponente,
  dependenciaAdm = SAEB_DEP_TOTAL,
  localizacao = SAEB_LOC_TOTAL
): Promise<SaebEvolucaoPonto[]> {
  const rows = await prisma.saebResultadoMunicipio.findMany({
    where: { dependenciaAdm, localizacao },
    orderBy: { anoSaeb: "asc" },
    select: {
      anoSaeb: true,
      media5Lp: true,
      media5Mt: true,
      media9Lp: true,
      media9Mt: true,
      media12Lp: true,
      media12Mt: true,
    },
  });

  const campo = `media${serie}${componente === "LP" ? "Lp" : "Mt"}` as
    | "media5Lp" | "media5Mt"
    | "media9Lp" | "media9Mt"
    | "media12Lp" | "media12Mt";

  return rows.map((r) => ({
    ano: r.anoSaeb,
    valor: r[campo] ?? null,
  }));
}

// ─── Distribuição de níveis ───────────────────────────────────────────────────

/**
 * Distribuição de níveis de proficiência para um ano, série, componente e segmentação.
 * Retorna array ordenado de { nivel: "0", percentual: 8.5 }
 */
export async function getSaebNiveisProficiencia(
  anoSaeb: number,
  serie: SaebSerie,
  componente: SaebComponente,
  dependenciaAdm = SAEB_DEP_TOTAL,
  localizacao = SAEB_LOC_TOTAL
): Promise<SaebNivelDistribuicao[]> {
  const row = await prisma.saebResultadoMunicipio.findUnique({
    where: { anoSaeb_dependenciaAdm_localizacao: { anoSaeb, dependenciaAdm, localizacao } },
  });

  if (!row) return [];

  const campo = `niveis${componente === "LP" ? "Lp" : "Mt"}${serie}` as
    | "niveisLp5" | "niveisMt5"
    | "niveisLp9" | "niveisMt9"
    | "niveisLp12" | "niveisMt12";

  const json = row[campo] as Record<string, number> | null;
  if (!json) return [];

  return Object.entries(json)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([nivel, percentual]) => ({ nivel, percentual }));
}

// ─── Comparativo de segmentação ───────────────────────────────────────────────

export interface SaebComparativoSegmento {
  label: string;
  media5Lp: number | null;
  media5Mt: number | null;
  media9Lp: number | null;
  media9Mt: number | null;
  media12Lp: number | null;
  media12Mt: number | null;
}

/**
 * Comparativo Urbana × Rural para um ano.
 * Usa a dependência "Total" para isolar apenas o efeito da localização.
 */
export async function getSaebComparativoLocalizacao(
  anoSaeb: number,
  dependenciaAdm = SAEB_DEP_TOTAL
): Promise<SaebComparativoSegmento[]> {
  const rows = await prisma.saebResultadoMunicipio.findMany({
    where: {
      anoSaeb,
      dependenciaAdm,
      localizacao: { in: [SAEB_LOC_TOTAL, SAEB_LOC_URBANA, SAEB_LOC_RURAL] },
    },
    orderBy: { localizacao: "asc" },
  });

  return rows.map((r) => ({
    label: r.localizacao,
    media5Lp: r.media5Lp,
    media5Mt: r.media5Mt,
    media9Lp: r.media9Lp,
    media9Mt: r.media9Mt,
    media12Lp: r.media12Lp,
    media12Mt: r.media12Mt,
  }));
}

/**
 * Comparativo Municipal × Estadual para um ano (localização Total).
 */
export async function getSaebComparativoDependencia(
  anoSaeb: number,
  localizacao = SAEB_LOC_TOTAL
): Promise<SaebComparativoSegmento[]> {
  const deps = [SAEB_DEP_MUNICIPAL, SAEB_DEP_ESTADUAL, SAEB_DEP_TOTAL];
  const rows = await prisma.saebResultadoMunicipio.findMany({
    where: { anoSaeb, localizacao, dependenciaAdm: { in: deps } },
    orderBy: { dependenciaAdm: "asc" },
  });

  const labelMap: Record<string, string> = {
    [SAEB_DEP_MUNICIPAL]: "Municipal",
    [SAEB_DEP_ESTADUAL]: "Estadual",
    [SAEB_DEP_TOTAL]: "Total",
  };

  return rows.map((r) => ({
    label: labelMap[r.dependenciaAdm] ?? r.dependenciaAdm,
    media5Lp: r.media5Lp,
    media5Mt: r.media5Mt,
    media9Lp: r.media9Lp,
    media9Mt: r.media9Mt,
    media12Lp: r.media12Lp,
    media12Mt: r.media12Mt,
  }));
}

// ─── Escolas ──────────────────────────────────────────────────────────────────

/** Lista escolas de um ano/segmento com contagem de alunos do SIGEduc */
export async function getSaebEscolas(
  anoSaeb: number,
  segmento?: string,
  rede = "Municipal"
): Promise<SaebEscolaResumo[]> {
  const rows = await prisma.saebResultadoEscola.findMany({
    where: {
      anoSaeb,
      rede,
      ...(segmento ? { segmento } : {}),
    },
    include: {
      escola: {
        select: {
          _count: { select: { estudantes: true } },
        },
      },
    },
    orderBy: { nomeEscola: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    codigoInep: r.codigoInep,
    nomeEscola: r.nomeEscola,
    rede: r.rede,
    segmento: r.segmento,
    indicadorRend: r.indicadorRend as Record<string, number> | null,
    aprovacoes: r.aprovacoes as Record<string, number> | null,
    escolaId: r.escolaId,
    totalAlunos: r.escola?._count.estudantes ?? null,
  }));
}

/** Histórico de uma escola específica ao longo dos anos (todos os anos disponíveis) */
export async function getSaebEscolaHistorico(codigoInep: string) {
  return prisma.saebResultadoEscola.findMany({
    where: { codigoInep },
    orderBy: [{ anoSaeb: "asc" }, { segmento: "asc" }],
  });
}

// ─── Resumo para os cards da Visão Geral ─────────────────────────────────────

export interface SaebResumoAno {
  anoSaeb: number;
  media5Lp: number | null;
  media5Mt: number | null;
  media9Lp: number | null;
  media9Mt: number | null;
  media12Lp: number | null;
  media12Mt: number | null;
  /** Variação em relação ao ano anterior (null se não houver ano anterior) */
  delta5Lp: number | null;
  delta5Mt: number | null;
  delta9Lp: number | null;
  delta9Mt: number | null;
}

/**
 * Resumo comparativo de dois anos consecutivos — usado nos cards da Visão Geral.
 * Retorna o ano selecionado e o delta em relação ao ano anterior.
 */
export async function getSaebResumoComDelta(
  anoSaeb: number,
  dependenciaAdm = SAEB_DEP_TOTAL,
  localizacao = SAEB_LOC_TOTAL
): Promise<SaebResumoAno | null> {
  // Buscar o ano selecionado e todos os anos disponíveis de uma vez
  const todos = await prisma.saebResultadoMunicipio.findMany({
    where: { dependenciaAdm, localizacao },
    orderBy: { anoSaeb: "asc" },
  });

  const atual = todos.find((r) => r.anoSaeb === anoSaeb);
  if (!atual) return null;

  const idx = todos.findIndex((r) => r.anoSaeb === anoSaeb);
  const anterior = idx > 0 ? todos[idx - 1] : null;

  const delta = (a: number | null, b: number | null) =>
    a !== null && b !== null ? Number((a - b).toFixed(2)) : null;

  return {
    anoSaeb,
    media5Lp: atual.media5Lp,
    media5Mt: atual.media5Mt,
    media9Lp: atual.media9Lp,
    media9Mt: atual.media9Mt,
    media12Lp: atual.media12Lp,
    media12Mt: atual.media12Mt,
    delta5Lp: delta(atual.media5Lp, anterior?.media5Lp ?? null),
    delta5Mt: delta(atual.media5Mt, anterior?.media5Mt ?? null),
    delta9Lp: delta(atual.media9Lp, anterior?.media9Lp ?? null),
    delta9Mt: delta(atual.media9Mt, anterior?.media9Mt ?? null),
  };
}
