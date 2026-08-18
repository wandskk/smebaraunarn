/**
 * Motor puro de distorção idade-série.
 *
 * Regra de negócio isolada de banco de dados e de UI (ver
 * lib/analytics/frequencia.ts para o mesmo princípio). Nenhuma função aqui
 * faz I/O nem depende de `new Date()`/fuso horário — datas são strings
 * ISO (YYYY-MM-DD) comparadas como calendário, não como instante.
 *
 * REGRA ADOTADA (versão "inep-2026", ver docs/PLANO_DESENVOLVIMENTO.md §8.1):
 * segue a metodologia do INEP para a Taxa de Distorção Idade-Série —
 * compara a idade do estudante numa data de referência com a idade
 * teoricamente adequada para a série cursada; distorção é declarada quando
 * a diferença é de 2 anos ou mais. Essa é a definição oficial usada no
 * Censo Escolar; o valor do limiar e a data de referência ainda não foram
 * formalmente confirmados pela Secretaria para o município — por isso são
 * parâmetros, não constantes fixas.
 *
 * Fora de escopo por definição: Educação Infantil não entra no indicador de
 * distorção idade-série (o próprio indicador do INEP não se aplica a ela).
 */

interface DataComposta {
  ano: number;
  mes: number;
  dia: number;
}

function interpretarDataIso(data: string): DataComposta | null {
  const partes = data.split("-").map(Number);
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia || partes.length !== 3) return null;
  return { ano, mes, dia };
}

/**
 * Idade completa (em anos) na data de referência, calculada por calendário
 * (considera se o aniversário do ano já ocorreu até a data de referência).
 * Retorna null se alguma das datas não estiver no formato YYYY-MM-DD — dado
 * de nascimento corrompido é um caso real observado em produção (ver
 * docs/PLANO_DESENVOLVIMENTO.md), não uma exceção de programação, então o
 * contrato é "sem resultado", não "lançar erro".
 */
export function calcularIdadeEmAnos(dataNascimento: string, dataReferencia: string): number | null {
  const nascimento = interpretarDataIso(dataNascimento);
  const referencia = interpretarDataIso(dataReferencia);
  if (!nascimento || !referencia) return null;

  let idade = referencia.ano - nascimento.ano;
  const aniversarioJaOcorreu =
    referencia.mes > nascimento.mes || (referencia.mes === nascimento.mes && referencia.dia >= nascimento.dia);
  if (!aniversarioJaOcorreu) idade -= 1;

  return idade;
}

/**
 * Identificadores estáveis de série/ano, desacoplados do formato bruto usado
 * pela fonte (SIGEduc usa códigos como "EFAFM6A" e o campo auxiliar "série"
 * chega como texto livre, ex. "6º Ano" — ver lib/queries/academico.ts). A
 * conversão do dado bruto para este tipo fica na camada de query, não aqui.
 */
export type SerieEnsino =
  | "EF_1"
  | "EF_2"
  | "EF_3"
  | "EF_4"
  | "EF_5"
  | "EF_6"
  | "EF_7"
  | "EF_8"
  | "EF_9"
  | "EM_1"
  | "EM_2"
  | "EM_3";

/** Idade teoricamente adequada por série, conforme Ensino Fundamental de 9 anos e Ensino Médio (padrão nacional/INEP). */
export const IDADE_ESPERADA_POR_SERIE: Readonly<Record<SerieEnsino, number>> = {
  EF_1: 6,
  EF_2: 7,
  EF_3: 8,
  EF_4: 9,
  EF_5: 10,
  EF_6: 11,
  EF_7: 12,
  EF_8: 13,
  EF_9: 14,
  EM_1: 15,
  EM_2: 16,
  EM_3: 17,
};

/** Defasagem mínima (em anos) para caracterizar distorção idade-série, no padrão INEP. */
export const LIMIAR_DISTORCAO_ANOS = 2;

export interface ResultadoDistorcao {
  idadeNaReferencia: number;
  idadeEsperada: number;
  /** idadeNaReferencia - idadeEsperada. Negativo significa idade abaixo do esperado. */
  defasagemAnos: number;
  emDistorcao: boolean;
}

/** Retorna null quando a data de nascimento ou a data de referência não pôde ser interpretada — ver calcularIdadeEmAnos. */
export function calcularDistorcaoIdadeSerie(
  dataNascimento: string,
  serie: SerieEnsino,
  dataReferencia: string,
  limiarAnos: number = LIMIAR_DISTORCAO_ANOS,
): ResultadoDistorcao | null {
  const idadeNaReferencia = calcularIdadeEmAnos(dataNascimento, dataReferencia);
  if (idadeNaReferencia === null) return null;

  const idadeEsperada = IDADE_ESPERADA_POR_SERIE[serie];
  const defasagemAnos = idadeNaReferencia - idadeEsperada;

  return {
    idadeNaReferencia,
    idadeEsperada,
    defasagemAnos,
    emDistorcao: defasagemAnos >= limiarAnos,
  };
}

export type IntensidadeDefasagem = "nenhuma" | "moderada" | "severa";

/** Moderada: 2-3 anos de defasagem. Severa: 4 anos ou mais. Abaixo de 2, não há distorção. */
export function classificarIntensidadeDefasagem(defasagemAnos: number): IntensidadeDefasagem {
  if (defasagemAnos >= 4) return "severa";
  if (defasagemAnos >= LIMIAR_DISTORCAO_ANOS) return "moderada";
  return "nenhuma";
}
