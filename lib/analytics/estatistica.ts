/**
 * Estatística descritiva pura e genérica — sem I/O, sem conhecimento de
 * domínio (nota, frequência, idade...). Existe porque o documento de visão
 * (centro_indicadores_educacionais.md §8) é explícito: "distribuição é mais
 * importante que média isolada" — duas escolas podem ter média 7,0 e
 * realidades completamente diferentes. Média sozinha já é calculada pelo
 * banco (`_avg` do Prisma); o que falta e vive aqui é o resto da
 * distribuição.
 */

function ordenar(valores: number[]): number[] {
  return [...valores].sort((a, b) => a - b);
}

/**
 * Percentil por interpolação linear entre os dois valores mais próximos
 * (mesmo método usado por padrão em numpy/Excel). `percentil` vai de 0 a
 * 100. Retorna null para lista vazia.
 */
export function calcularPercentil(valores: number[], percentil: number): number | null {
  if (valores.length === 0) return null;
  if (percentil <= 0) return Math.min(...valores);
  if (percentil >= 100) return Math.max(...valores);

  const ordenados = ordenar(valores);
  const indice = (percentil / 100) * (ordenados.length - 1);
  const indiceInferior = Math.floor(indice);
  const indiceSuperior = Math.ceil(indice);

  if (indiceInferior === indiceSuperior) return ordenados[indiceInferior]!;

  const peso = indice - indiceInferior;
  return ordenados[indiceInferior]! + (ordenados[indiceSuperior]! - ordenados[indiceInferior]!) * peso;
}

export function calcularMediana(valores: number[]): number | null {
  return calcularPercentil(valores, 50);
}

/** Diferença entre o maior e o menor valor. Null para lista vazia. */
export function calcularAmplitude(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.max(...valores) - Math.min(...valores);
}

/** Percentual (0-100) de valores estritamente abaixo do limite informado. Null para lista vazia. */
export function calcularProporcaoAbaixoDe(valores: number[], limite: number): number | null {
  if (valores.length === 0) return null;
  const abaixo = valores.filter((v) => v < limite).length;
  return (abaixo / valores.length) * 100;
}
