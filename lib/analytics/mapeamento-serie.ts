/**
 * Conversão de texto bruto de série (como armazenado em NotaEstudante.serie
 * e ServidorTurma.serie, vindo do SIGEduc) para o identificador estável
 * `SerieEnsino` usado por lib/analytics/distorcao.ts.
 *
 * Função pura — não faz I/O. Fica fora de distorcao.ts de propósito (ver
 * comentário no topo daquele arquivo): a fórmula de distorção não deveria
 * precisar saber como a fonte de dados escreve o nome da série.
 *
 * Formatos confirmados em produção (2026-08-18, ver
 * docs/PLANO_DESENVOLVIMENTO.md): "1º Ano".."9º Ano" para Ensino
 * Fundamental regular. Não há Ensino Médio na rede (município só oferece
 * Educação Infantil, Fundamental e EJA — Ensino Médio é atribuição
 * estadual no Brasil), mas o mapeamento para "Nª Série" fica pronto para
 * o caso de a rede vir a oferecer no futuro.
 *
 * Retorna `null` — de propósito, não é uma falha — para todo o resto
 * observado nos dados reais, porque nenhum desses casos tem uma única
 * idade esperada bem definida:
 *   - Educação Infantil ("NÍVEL I", "NÍVEL II", "MISTA (...)") — fora do
 *     escopo do indicador de distorção idade-série por definição.
 *   - EJA por período ("2º PERIODO (2º E 3º ANO)" etc.) — cada período
 *     agrupa 2 anos-série e atende adultos fora da faixa etária regular;
 *     o próprio programa existe para atender quem já está fora da idade
 *     regular, então "distorção" não é o conceito certo para EJA.
 *   - "TRAJETÓRIA DE SUCESSO I/II" — programa de correção de fluxo que
 *     agrupa 2 anos-série; pelo mesmo motivo do EJA, os estudantes já
 *     estão ali por causa de uma distorção conhecida, não é uma turma
 *     regular de uma única série.
 *   - "EDUCAÇÃO ESPECIAL" — turma sem série regular associada.
 *   - "MULTIANUAL (...)" — turma multisseriada rural, agrupa várias séries.
 */

import type { SerieEnsino } from "./distorcao";

/**
 * Aceita tanto o indicador ordinal (º/ª, U+00BA/U+00AA) quanto o símbolo de
 * grau (°, U+00B0) antes de "Ano"/"Série" — os dados reais da rede usam os
 * dois interculadamente (ex.: "6º Ano" vs "6° E 7° ANO" dentro do mesmo
 * campo `serie`), e um único caractere aceito faria uma série regular
 * escrita com a variante errada cair silenciosamente em "fora do escopo".
 */
const REGEX_ANO_FUNDAMENTAL = /^(\d)\s*[º°]\s*ano$/i;
const REGEX_SERIE_MEDIO = /^(\d)\s*[ª°]\s*s[ée]rie$/i;

export function normalizarSerie(serieTexto: string | null | undefined): SerieEnsino | null {
  if (!serieTexto) return null;
  const texto = serieTexto.trim();

  const fundamental = texto.match(REGEX_ANO_FUNDAMENTAL);
  if (fundamental) {
    const numero = Number(fundamental[1]);
    if (numero >= 1 && numero <= 9) return `EF_${numero}` as SerieEnsino;
  }

  const medio = texto.match(REGEX_SERIE_MEDIO);
  if (medio) {
    const numero = Number(medio[1]);
    if (numero >= 1 && numero <= 3) return `EM_${numero}` as SerieEnsino;
  }

  return null;
}
