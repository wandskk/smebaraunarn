/**
 * Regras puras para comparar um indicador de escola com a referência de
 * rede. Nenhuma depende de Prisma/I-O — os totais por escola já vêm
 * calculados pelo chamador (ver lib/queries/comparativos.ts).
 */

/**
 * Média ponderada de valores já agregados por escola (ex.: nota média,
 * ponderada pelo número de notas lançadas) — evita que uma escola pequena
 * pese igual a uma escola grande na média de rede. Matematicamente
 * equivalente a somar os totais brutos por trás de cada média e dividir no
 * fim, sem precisar reexpor esses totais brutos quando a fonte já entrega só
 * a média agregada por escola.
 */
export function calcularMediaPonderada(itens: { valor: number; peso: number }[]): number | null {
  const pesoTotal = itens.reduce((acc, item) => acc + item.peso, 0);
  if (pesoTotal <= 0) return null;
  const somaPonderada = itens.reduce((acc, item) => acc + item.valor * item.peso, 0);
  return somaPonderada / pesoTotal;
}

/**
 * Diferença entre o valor de uma escola e a referência de rede (mesma
 * unidade dos dois: pontos percentuais, pontos de nota, etc.). Null se
 * qualquer um dos dois lados não tiver dado — não faz sentido comparar
 * contra uma referência ausente.
 */
export function calcularDiferencaParaRede(
  valorEscola: number | null | undefined,
  referenciaRede: number | null | undefined,
): number | null {
  if (valorEscola === null || valorEscola === undefined) return null;
  if (referenciaRede === null || referenciaRede === undefined) return null;
  return valorEscola - referenciaRede;
}
