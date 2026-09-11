/**
 * Motor puro de distorção idade-série.
 *
 * Regra de negócio isolada de banco de dados e de UI (ver
 * lib/analytics/frequencia.ts para o mesmo princípio). Nenhuma função aqui
 * faz I/O nem depende de `new Date()`/fuso horário — datas de nascimento são
 * strings ISO (YYYY-MM-DD), mas só o ANO delas é usado (ver justificativa
 * abaixo).
 *
 * REGRA ADOTADA (versão "inep-oficial-2026", ver docs/PLANO_DESENVOLVIMENTO.md
 * §8.1): segue a metodologia OFICIAL do INEP para a Taxa de Distorção
 * Idade-Série, confirmada no "Dicionário de Indicadores Educacionais —
 * Fórmulas de Cálculo" (item D.2, download.inep.gov.br):
 *
 *   "Como o Censo Escolar obtém a informação sobre idade por meio do ano de
 *   nascimento... os alunos que nasceram em t-[i+1] completam i+1 anos no
 *   ano t e, portanto, em algum momento deste ano (de 1º de janeiro a 31 de
 *   dezembro) ainda permaneciam com i anos e, por isso, o critério aqui
 *   adotado considera estes alunos como tendo idade adequada para esta
 *   série."
 *
 * Ou seja: a "idade" usada pelo INEP é `anoReferencia - anoNascimento` —
 * SEM olhar mês/dia — porque o critério oficial é "qual idade o aluno
 * completa (ou já tinha) em algum momento do ano t", não a idade calendário
 * numa data específica. Uma versão anterior deste motor usava idade
 * calendário travada em 31/03, o que subestimava a distorção pela metade
 * em algumas séries (a maioria dos aniversários cai entre abril e
 * dezembro, então a idade em 31/03 já vem 1 ano "atrasada" em relação à
 * idade que o INEP considera). Confirmado comparando com o TDI oficial
 * publicado pelo INEP para Baraúna em 2025 (planilha TDI_MUNICIPIOS_2025,
 * rede Municipal): a versão anterior errava por até 20 pontos percentuais
 * por série; esta versão bate em ±2pp.
 *
 * Limiar de 2 anos de defasagem: também definição oficial do INEP, não é
 * parâmetro específico do município — mantido configurável (`limiarAnos`)
 * só porque a Secretaria pode, no futuro, querer simular outros cortes.
 *
 * Fora de escopo por definição: Educação Infantil não entra no indicador de
 * distorção idade-série (o próprio indicador do INEP não se aplica a ela).
 */

import { normalizarSerie } from "./mapeamento-serie";
import type { PontoEvolucaoAnual } from "./frequencia";

function interpretarAnoNascimento(dataNascimento: string): number | null {
  const partes = dataNascimento.split("-").map(Number);
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia || partes.length !== 3) return null;
  return ano;
}

/**
 * Idade que o estudante completa (ou já tinha completado) em ALGUM momento
 * do ano de referência — `anoReferencia - anoNascimento`, deliberadamente
 * sem ajustar por mês/dia. Esta é a definição oficial do INEP pro indicador
 * de distorção idade-série (ver comentário no topo do arquivo), não um
 * cálculo de idade calendário numa data específica. Retorna null se a data
 * de nascimento não estiver no formato YYYY-MM-DD — dado corrompido é um
 * caso real observado em produção (ver docs/PLANO_DESENVOLVIMENTO.md), não
 * uma exceção de programação, então o contrato é "sem resultado", não
 * "lançar erro".
 */
export function calcularIdadeCompletadaNoAno(dataNascimento: string, anoReferencia: number): number | null {
  const anoNascimento = interpretarAnoNascimento(dataNascimento);
  if (anoNascimento === null) return null;
  return anoReferencia - anoNascimento;
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
  idadeCompletadaNoAno: number;
  idadeEsperada: number;
  /** idadeCompletadaNoAno - idadeEsperada. Negativo significa idade abaixo do esperado. */
  defasagemAnos: number;
  emDistorcao: boolean;
}

/** Retorna null quando a data de nascimento não pôde ser interpretada — ver calcularIdadeCompletadaNoAno. */
export function calcularDistorcaoIdadeSerie(
  dataNascimento: string,
  serie: SerieEnsino,
  anoReferencia: number,
  limiarAnos: number = LIMIAR_DISTORCAO_ANOS,
): ResultadoDistorcao | null {
  const idadeCompletadaNoAno = calcularIdadeCompletadaNoAno(dataNascimento, anoReferencia);
  if (idadeCompletadaNoAno === null) return null;

  const idadeEsperada = IDADE_ESPERADA_POR_SERIE[serie];
  const defasagemAnos = idadeCompletadaNoAno - idadeEsperada;

  return {
    idadeCompletadaNoAno,
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

export interface MatriculaParaDistorcao {
  dataNascimento: string | null;
  escolaId: number | null;
  serieTexto: string | null;
}

/**
 * Calcula a evolução da taxa de distorção idade-série por ano em memória a
 * partir do mapa de matrículas resolvidas — parte pura/testável da query
 * `getEvolucaoDistorcaoPorAno`.
 *
 * Para cada ano pedido (em ordem cronológica ascendente), filtra por escolaId se
 * especificado, calcula a distorção para os alunos elegíveis (com data de
 * nascimento válida e série regular normalizada) usando o próprio ano letivo
 * como ano de referência (metodologia INEP — ver comentário no topo do
 * arquivo), e retorna o percentual de distorção (ou null se não houver
 * alunos elegíveis no ano).
 */
export function calcularEvolucaoDistorcaoPorAno(
  anos: number[],
  matriculasPorAno: Map<number, Map<string, MatriculaParaDistorcao>>,
  escolaId?: number,
  limiarAnos: number = LIMIAR_DISTORCAO_ANOS,
): PontoEvolucaoAnual[] {
  const anosOrdenados = Array.from(new Set(anos)).sort((a, b) => a - b);

  return anosOrdenados.map((ano) => {
    const matriculaDoAno = matriculasPorAno.get(ano);
    if (!matriculaDoAno || matriculaDoAno.size === 0) {
      return { ano, valor: null };
    }

    let totalElegiveis = 0;
    let emDistorcao = 0;

    for (const dados of matriculaDoAno.values()) {
      if (escolaId !== undefined && dados.escolaId !== escolaId) {
        continue;
      }

      const serie = normalizarSerie(dados.serieTexto);
      const resultado = serie && dados.dataNascimento
        ? calcularDistorcaoIdadeSerie(dados.dataNascimento, serie, ano, limiarAnos)
        : null;

      if (resultado === null || !serie) {
        continue;
      }

      totalElegiveis += 1;
      if (resultado.emDistorcao) {
        emDistorcao += 1;
      }
    }

    const valor = totalElegiveis > 0 ? (emDistorcao / totalElegiveis) * 100 : null;
    return { ano, valor };
  });
}

