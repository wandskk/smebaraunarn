/**
 * Motor puro de indicadores de frequência.
 *
 * Regras de negócio isoladas de banco de dados e de UI, para permitir 100% de
 * cobertura de testes e trocar a fonte dos dados (SIGEduc hoje, outra fonte
 * amanhã) sem alterar a fórmula. Nenhuma função aqui faz I/O.
 *
 * A agregação "um registro por dia por estudante" (a origem grava frequência
 * por disciplina/aula, não por dia) é responsabilidade da camada de query
 * (lib/queries), não deste módulo.
 */

export interface RegistroDiario {
  /** Data no formato ISO (YYYY-MM-DD). */
  data: string;
  /** true se o estudante faltou no dia (após agregar as aulas do dia). */
  faltou: boolean;
}

export type TendenciaFrequencia = "alta" | "queda" | "estavel";

export interface VariacaoFrequencia {
  /** Diferença em pontos percentuais: atual - anterior. */
  diferencaPontosPercentuais: number;
  tendencia: TendenciaFrequencia;
}

/** Abaixo desta variação absoluta (em p.p.), a frequência é tratada como estável. */
const LIMIAR_ESTABILIDADE_PP = 0.5;

/**
 * Compara a frequência do período atual com a do período anterior.
 * Ambos os percentuais devem estar na mesma escala (0-100).
 */
export function calcularVariacaoFrequencia(
  percentualAtual: number,
  percentualAnterior: number,
): VariacaoFrequencia {
  const diferencaPontosPercentuais = percentualAtual - percentualAnterior;

  let tendencia: TendenciaFrequencia = "estavel";
  if (diferencaPontosPercentuais > LIMIAR_ESTABILIDADE_PP) tendencia = "alta";
  else if (diferencaPontosPercentuais < -LIMIAR_ESTABILIDADE_PP) tendencia = "queda";

  return { diferencaPontosPercentuais, tendencia };
}

export interface SequenciaFaltas {
  dataInicio: string;
  dataFim: string;
  duracaoDias: number;
}

/**
 * Identifica todas as sequências de faltas consecutivas (dias seguidos com
 * `faltou = true`, sem nenhum dia de presença no meio) em um histórico de
 * registros diários. O histórico não precisa estar ordenado.
 *
 * "Consecutivo" aqui é sobre dias letivos registrados, não sobre dias de
 * calendário — se não há registro de um dia (feriado, fim de semana), ele
 * simplesmente não existe na lista e não interrompe nem estende a sequência.
 */
export function identificarSequenciasDeFaltas(registros: RegistroDiario[]): SequenciaFaltas[] {
  const ordenados = [...registros].sort((a, b) => a.data.localeCompare(b.data));

  const sequencias: SequenciaFaltas[] = [];
  let inicioAtual: string | null = null;
  let fimAtual: string | null = null;
  let duracaoAtual = 0;

  const fecharSequencia = () => {
    if (inicioAtual !== null && fimAtual !== null) {
      sequencias.push({ dataInicio: inicioAtual, dataFim: fimAtual, duracaoDias: duracaoAtual });
    }
    inicioAtual = null;
    fimAtual = null;
    duracaoAtual = 0;
  };

  for (const registro of ordenados) {
    if (registro.faltou) {
      if (inicioAtual === null) inicioAtual = registro.data;
      fimAtual = registro.data;
      duracaoAtual += 1;
    } else {
      fecharSequencia();
    }
  }
  fecharSequencia();

  return sequencias;
}

/**
 * Duração (em dias) da sequência de faltas em andamento no fim do histórico
 * (isto é, a sequência que inclui o último registro, se ele for uma falta).
 * Retorna 0 se o último registro não for falta ou se não houver registros.
 */
export function faltasConsecutivasAtuais(registros: RegistroDiario[]): number {
  const sequencias = identificarSequenciasDeFaltas(registros);
  if (sequencias.length === 0 || registros.length === 0) return 0;

  const ultimaData = [...registros].sort((a, b) => a.data.localeCompare(b.data)).at(-1)!.data;
  const sequenciaFinal = sequencias.find((s) => s.dataFim === ultimaData);
  return sequenciaFinal?.duracaoDias ?? 0;
}

export type GravidadeFaltasConsecutivas = "nenhuma" | "atencao" | "alerta" | "critico";

/**
 * Limiares padrão de dias consecutivos de falta citados no documento de
 * visão do produto (seção 6 — "3 dias, 5 dias, 10 dias, ou regras definidas
 * pela rede"). Configuráveis por chamada; estes são apenas o valor inicial.
 */
export const LIMIARES_PADRAO_FALTAS_CONSECUTIVAS = {
  atencao: 3,
  alerta: 5,
  critico: 10,
} as const;

export function classificarGravidadeFaltasConsecutivas(
  diasConsecutivos: number,
  limiares: { atencao: number; alerta: number; critico: number } = LIMIARES_PADRAO_FALTAS_CONSECUTIVAS,
): GravidadeFaltasConsecutivas {
  if (diasConsecutivos >= limiares.critico) return "critico";
  if (diasConsecutivos >= limiares.alerta) return "alerta";
  if (diasConsecutivos >= limiares.atencao) return "atencao";
  return "nenhuma";
}

/**
 * Percentual de presença a partir do total de aulas e faltas no período.
 * Retorna null quando não há aulas registradas (não é possível calcular),
 * em vez de dividir por zero.
 */
export function calcularPercentualFrequencia(totalAulas: number, totalFaltas: number): number | null {
  if (totalAulas <= 0) return null;
  return ((totalAulas - totalFaltas) / totalAulas) * 100;
}

export interface PontoEvolucaoFrequencia {
  /** ISO (YYYY-MM-DD). */
  data: string;
  /** Percentual de presença da rede naquele dia. Null se não houver aula registrada no dia. */
  percentual: number | null;
}

/**
 * Transforma totais diários de aulas/faltas (já agregados pela rede inteira
 * via `groupBy` em lib/queries/frequencia.ts:getEvolucaoFrequenciaRede) em
 * uma série cronológica de percentuais — só a parte pura/testável dessa
 * query, para não precisar de banco para testar a transformação. Dias sem
 * nenhuma aula registrada (fim de semana, recesso) simplesmente não entram
 * na entrada — não há "dia com 0 aulas" para transformar em null aqui,
 * quem decide incluir ou não um dia na consulta é o `groupBy` de origem.
 */
export function calcularEvolucaoFrequencia(
  registrosDiarios: { data: string; aulas: number; faltas: number }[],
): PontoEvolucaoFrequencia[] {
  return registrosDiarios
    .map((r) => ({ data: r.data, percentual: calcularPercentualFrequencia(r.aulas, r.faltas) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export interface JanelaDias {
  /** Data inicial da janela, formato ISO (YYYY-MM-DD), inclusive. */
  inicio: string;
  /** Data final da janela, formato ISO (YYYY-MM-DD), inclusive. */
  fim: string;
}

/**
 * Janela de `dias` dias corridos terminando em `referencia` (inclusive nas
 * duas pontas — ex.: `dias=90` a partir de hoje cobre hoje e os 89 dias
 * anteriores). Existe para que um recorte "últimos N dias" seja sempre um
 * período de calendário real, nunca "os N registros mais recentes" — ver
 * achado do master prompt: "'últimos 90 registros' tratados como se fossem
 * 'últimos 90 dias'" (docs/plano-evolucao-sme/etapas/02-contexto-temporal-e-freshness.md).
 * `FrequenciaEstudante.data` é armazenada como string ISO (YYYY-MM-DD), por
 * isso o retorno já vem no formato pronto para comparação lexicográfica em
 * `where: { data: { gte, lte } }`.
 */
export function calcularJanelaDias(referencia: Date, dias: number): JanelaDias {
  const paraIso = (data: Date) => data.toISOString().slice(0, 10);
  const inicio = new Date(referencia.getTime() - (dias - 1) * 24 * 60 * 60 * 1000);
  return { inicio: paraIso(inicio), fim: paraIso(referencia) };
}

export type FaixaFrequencia = "adequada" | "atencao" | "critica";

export interface FaixasFrequencia {
  /** Percentual mínimo (inclusive) para ser considerada "adequada". */
  minimoAdequada: number;
  /** Percentual mínimo (inclusive) para ser considerada "atenção" (abaixo disso é "crítica"). */
  minimoAtencao: number;
}

/**
 * Faixas provisórias — a rede ainda não tem um valor oficial registrado
 * (ver docs/PLANO_DESENVOLVIMENTO.md, seção 8, item 2). Ajustar aqui quando a
 * Secretaria definir o critério oficial.
 */
export const FAIXAS_PADRAO_FREQUENCIA: FaixasFrequencia = {
  minimoAdequada: 85,
  minimoAtencao: 75,
};

export function classificarFaixaFrequencia(
  percentual: number,
  faixas: FaixasFrequencia = FAIXAS_PADRAO_FREQUENCIA,
): FaixaFrequencia {
  if (percentual >= faixas.minimoAdequada) return "adequada";
  if (percentual >= faixas.minimoAtencao) return "atencao";
  return "critica";
}
