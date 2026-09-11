/**
 * Catálogo dos filtros do portal "Avaliação e Acompanhamento das
 * Aprendizagens nos Anos Finais" (MEC/CAEd — Pacto Nacional pela
 * Recomposição das Aprendizagens) — espelha as opções reais do site pra
 * quem for montar filtros/importação. Mesma plataforma (CAEd/UFJF) do
 * Criança Alfabetizada (`lib/caed-catalogo.ts`), domínio e catálogo
 * diferentes: por isso um arquivo à parte, não uma extensão do catálogo dos
 * anos iniciais — ver decisão de manter os dois pipelines separados em
 * `scripts/extrair-anosfinais-escolas.ts`.
 *
 * Investigação feita em 2026-09-11 navegando logado (Marcos Antônio de
 * Sousa, gestor municipal) em `avaliacaoaprendizagensanosfinais.mec.gov.br`.
 */

/** Mesmos códigos de ciclo do CAEd (AV1/AV2/AV3) — plataforma idêntica, só o catálogo de etapas/componentes muda. */
export const ANOS_FINAIS_CICLOS = [
  { codigoCiclo: "AV1", nomeCiclo: "Ciclo I" },
  { codigoCiclo: "AV2", nomeCiclo: "Ciclo II" },
  { codigoCiclo: "AV3", nomeCiclo: "Ciclo III" },
] as const;

export type AnosFinaisCodigoCiclo = (typeof ANOS_FINAIS_CICLOS)[number]["codigoCiclo"];
export type AnosFinaisNomeCiclo = (typeof ANOS_FINAIS_CICLOS)[number]["nomeCiclo"];

/** Ciclos disponíveis por ano — confirmado navegando pelas abas "Resultados 2024/2025/2026"; só 2025 tem Ciclo III. */
export const ANOS_FINAIS_CICLOS_POR_ANO: Record<number, AnosFinaisCodigoCiclo[]> = {
  2024: ["AV1", "AV2"],
  2025: ["AV1", "AV2", "AV3"],
  2026: ["AV1", "AV2"],
};

export const ANOS_FINAIS_ANOS_ESCOLARES = [
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 6º ANO", label: "6º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 7º ANO", label: "7º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 8º ANO", label: "8º ano do Ensino Fundamental" },
  { valor: "ENSINO FUNDAMENTAL DE 9 ANOS - 9º ANO", label: "9º ano do Ensino Fundamental" },
] as const;

/**
 * Diferença chave em relação ao CAEd anos iniciais: não existe "Fluência"
 * aqui (isso é só alfabetização, 1º-5º ano); em vez disso, os Anos Finais
 * têm "Ciências da Natureza" como quarto componente.
 */
export const ANOS_FINAIS_COMPONENTES = [
  { slug: "LP_LEITURA", label: "Língua Portuguesa (Leitura)" },
  { slug: "LP_ESCRITA", label: "Língua Portuguesa (Escrita)" },
  { slug: "MATEMATICA", label: "Matemática" },
  { slug: "CIENCIAS_NATUREZA", label: "Ciências da Natureza" },
] as const;

export const ANOS_FINAIS_REDES = [
  { valor: "MUNICIPAL", label: "Municipal" },
  { valor: "ESTADUAL", label: "Estadual" },
  { valor: "PUBLICA", label: "Pública (Municipal + Estadual)" },
] as const;

/** Sentinela gravado em `AvaliacaoResultadoTurma.turma` quando a fonte só tem o agregado da escola, sem turma real (mesmo padrão do CAEd). */
export const ANOS_FINAIS_TURMA_SENTINELA_ESCOLA = "TODAS AS TURMAS (agregado da escola)";
