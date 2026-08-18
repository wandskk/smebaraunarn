/**
 * Regras puras de qualidade de dados: nenhuma depende de Prisma/I-O, só de
 * valores já lidos do banco pelo chamador (ver lib/queries/qualidade-dados.ts).
 */

export type SituacaoSincronizacao = "em-dia" | "atrasado" | "sem-sincronizacao";

/**
 * Classifica um módulo de sincronização pela última execução com SUCESSO.
 * `limiarHoras` default (30h) dá folga sobre o ciclo diário do cron
 * (roda entre 2h e 2h50 — ver vercel.json) sem soar falso alarme por um
 * atraso de poucas horas.
 */
export function classificarSituacaoSincronizacao(
  ultimoSucessoEm: Date | null,
  agora: Date,
  limiarHoras = 30,
): SituacaoSincronizacao {
  if (ultimoSucessoEm === null) return "sem-sincronizacao";
  const diffHoras = (agora.getTime() - ultimoSucessoEm.getTime()) / (1000 * 60 * 60);
  if (diffHoras < 0) return "em-dia"; // relógio/fuso não deve gerar falso atraso
  return diffHoras > limiarHoras ? "atrasado" : "em-dia";
}

/**
 * Um código de turma é usado por mais de uma escola (achado confirmado em
 * produção: 34 códigos em 2026-08-18 — ver docs/PLANO_DESENVOLVIMENTO.md §8
 * item 6). Isso por si só não é um erro: pode ser coincidência de
 * nomenclatura sem risco, desde que a série resolvida seja a mesma nas
 * escolas colidentes. Diverge apenas quando as escolas atribuem séries
 * diferentes ao mesmo código — aí sim é um risco real de indicador errado.
 */
export function possuiDivergenciaDeSerie(seriesPorEscola: (string | null)[]): boolean {
  const distintas = new Set(seriesPorEscola.filter((s): s is string => Boolean(s)));
  return distintas.size > 1;
}
