/**
 * Catálogo dos filtros do portal Criança Alfabetizada (CAEd/UFJF) —
 * espelha as opções reais do site (Avaliação/Ciclo, Ano escolar,
 * Componente curricular, Rede) para os selects do formulário de
 * importação. Sem dependência de Prisma — pode ser importado por
 * componentes client.
 *
 * Importante: o CSV exportado pelo site traz "Componente Curricular" só
 * como "LÍNGUA PORTUGUESA" tanto para Leitura quanto para Escrita — não dá
 * pra distinguir as duas só pelo conteúdo do arquivo. Por isso o
 * componente é sempre um select explícito (autoritativo), nunca lido do
 * CSV.
 */

/** Nem todo ano tem os 3 ciclos — 2025 foi o primeiro com Ciclo III; anos anteriores param no Ciclo II. */
export const CAED_CICLOS = [
  { codigoCiclo: "AV1", nomeCiclo: "Ciclo I" },
  { codigoCiclo: "AV2", nomeCiclo: "Ciclo II" },
  { codigoCiclo: "AV3", nomeCiclo: "Ciclo III" },
] as const;

export type CaedCodigoCiclo = (typeof CAED_CICLOS)[number]["codigoCiclo"];
export type CaedNomeCiclo = (typeof CAED_CICLOS)[number]["nomeCiclo"];

export const CAED_ANOS_ESCOLARES = [
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 1º ANO", label: "1º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 2º ANO", label: "2º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 3º ANO", label: "3º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 4º ANO", label: "4º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 5º ANO", label: "5º ano do Ensino Fundamental" },
] as const;

export const CAED_COMPONENTES = [
  { slug: "LP_LEITURA", label: "Língua Portuguesa (Leitura)" },
  { slug: "LP_ESCRITA", label: "Língua Portuguesa (Escrita)" },
  { slug: "MATEMATICA", label: "Matemática" },
  { slug: "FLUENCIA", label: "Fluência" },
] as const;

export const CAED_REDES = [
  { valor: "MUNICIPAL", label: "Municipal" },
  { valor: "ESTADUAL", label: "Estadual" },
  { valor: "PUBLICA", label: "Pública (Municipal + Estadual)" },
] as const;

/** Sentinela gravado em `AvaliacaoResultadoTurma.turma` quando a fonte só tem o agregado da escola, sem turma real. */
export const CAED_TURMA_SENTINELA_ESCOLA = "TODAS AS TURMAS (agregado da escola)";
