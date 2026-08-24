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
 * Detecta uma execução de sincronização travada: o último log do módulo
 * ficou em "PROCESSANDO" (sincronizações grandes gravam um log por
 * lote/página, terminando com SUCESSO no último) há mais tempo do que uma
 * execução legítima levaria para avançar para o próximo lote. Sem isso, uma
 * sincronização manual abandonada com a aba fechada, ou um timeout de
 * função serverless no meio de um cron, fica marcada como "em dia" para
 * sempre — porque `classificarSituacaoSincronizacao` só olha para o último
 * SUCESSO, não para o log mais recente (achado do master prompt: "detectar
 * execução incompleta (PROCESSANDO sem SUCESSO final)").
 *
 * `limiarMinutos` (default 10) é generoso frente ao tempo real de um lote
 * (ver `maxDuration` das rotas de cron, 45–120s) — uma folga grande evita
 * marcar como travada uma execução que só está demorando um pouco mais.
 */
export function execucaoIncompleta(
  ultimoLog: { status: string; createdAt: Date } | null,
  agora: Date,
  limiarMinutos = 10,
): boolean {
  if (ultimoLog === null || ultimoLog.status !== "PROCESSANDO") return false;
  const diffMinutos = (agora.getTime() - ultimoLog.createdAt.getTime()) / (1000 * 60);
  return diffMinutos >= limiarMinutos;
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
