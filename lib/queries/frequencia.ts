import { prisma } from "@/lib/prisma";
import {
  calcularPercentualFrequencia,
  calcularVariacaoFrequencia,
  classificarFaixaFrequencia,
  FAIXAS_PADRAO_FREQUENCIA,
  type FaixaFrequencia,
  type FaixasFrequencia,
  type VariacaoFrequencia,
} from "@/lib/analytics/frequencia";
import { resolverMatriculaPorAno } from "@/lib/queries/distorcao";

export interface JanelaComparativa {
  atualInicio: string;
  atualFim: string;
  anteriorInicio: string;
  anteriorFim: string;
}

export interface FiltroFrequenciaPorEscola extends JanelaComparativa {
  anoLetivo: number;
  faixasFrequencia?: FaixasFrequencia;
}

export interface FrequenciaEscola {
  /** Null quando a escola do aluno naquele ano não bate com nenhuma Escola sincronizada. */
  escolaId: number | null;
  nomeEscola: string;
  totalEstudantes: number;
  percentualAtual: number | null;
  percentualAnterior: number | null;
  variacao: VariacaoFrequencia | null;
  faixa: FaixaFrequencia | null;
  /**
   * Totais brutos (aulas/faltas) por trás dos percentuais acima — expostos
   * para permitir agregações corretas por quem consome esta lista (ex.:
   * lib/queries/comparativos.ts soma esses totais entre escolas para obter o
   * percentual real da rede, em vez de fazer média dos percentuais já
   * arredondados por escola).
   */
  aulasAtual: number;
  faltasAtual: number;
  aulasAnterior: number;
  faltasAnterior: number;
}

/**
 * Soma só por janela de data — não filtra por `Estudante.ano` porque quem
 * decide "esse aluno conta no ano letivo X" é o chamador (via o mapa de
 * matrícula→escola resolvido em `resolverMatriculaPorAno`), não esta soma.
 */
async function somarFrequenciaPorEstudante(inicio: string, fim: string) {
  const registros = await prisma.frequenciaEstudante.groupBy({
    by: ["estudanteMatricula"],
    where: { data: { gte: inicio, lte: fim } },
    _sum: { falta: true, quantidadeAula: true },
  });

  return new Map(registros.map((r) => [r.estudanteMatricula, { aulas: r._sum.quantidadeAula ?? 0, faltas: r._sum.falta ?? 0 }]));
}

/**
 * Frequência por escola, com comparação entre duas janelas de data
 * (JanelaComparativa) para calcular tendência — ver
 * lib/analytics/frequencia.ts:calcularVariacaoFrequencia. Responde à
 * pergunta central da página de frequência (ver
 * centro_indicadores_educacionais.md §25): "onde a frequência está
 * piorando?" — por isso o resultado já vem ordenado da pior para a melhor.
 */
export async function getFrequenciaPorEscola(filtro: FiltroFrequenciaPorEscola): Promise<FrequenciaEscola[]> {
  const faixasFrequencia = filtro.faixasFrequencia ?? FAIXAS_PADRAO_FREQUENCIA;

  const [matriculaPorAno, escolas, somaAtual, somaAnterior] = await Promise.all([
    resolverMatriculaPorAno(filtro.anoLetivo),
    prisma.escola.findMany({ select: { id: true, nome: true } }),
    somarFrequenciaPorEstudante(filtro.atualInicio, filtro.atualFim),
    somarFrequenciaPorEstudante(filtro.anteriorInicio, filtro.anteriorFim),
  ]);

  const nomePorEscola = new Map(escolas.map((e) => [e.id, e.nome]));

  const totaisPorEscola = new Map<number | null, { totalEstudantes: number; atual: { aulas: number; faltas: number }; anterior: { aulas: number; faltas: number } }>();
  for (const [matricula, dados] of matriculaPorAno) {
    const acumulado = totaisPorEscola.get(dados.escolaId) ?? {
      totalEstudantes: 0,
      atual: { aulas: 0, faltas: 0 },
      anterior: { aulas: 0, faltas: 0 },
    };
    acumulado.totalEstudantes += 1;

    const atual = somaAtual.get(matricula);
    if (atual) {
      acumulado.atual.aulas += atual.aulas;
      acumulado.atual.faltas += atual.faltas;
    }
    const anterior = somaAnterior.get(matricula);
    if (anterior) {
      acumulado.anterior.aulas += anterior.aulas;
      acumulado.anterior.faltas += anterior.faltas;
    }

    totaisPorEscola.set(dados.escolaId, acumulado);
  }

  const resultado: FrequenciaEscola[] = [];
  for (const [escolaId, dados] of totaisPorEscola) {
    const percentualAtual = calcularPercentualFrequencia(dados.atual.aulas, dados.atual.faltas);
    const percentualAnterior = calcularPercentualFrequencia(dados.anterior.aulas, dados.anterior.faltas);

    resultado.push({
      escolaId,
      nomeEscola: escolaId === null ? "Escola não identificada" : (nomePorEscola.get(escolaId) ?? `Escola #${escolaId}`),
      totalEstudantes: dados.totalEstudantes,
      percentualAtual,
      percentualAnterior,
      variacao:
        percentualAtual !== null && percentualAnterior !== null
          ? calcularVariacaoFrequencia(percentualAtual, percentualAnterior)
          : null,
      faixa: percentualAtual !== null ? classificarFaixaFrequencia(percentualAtual, faixasFrequencia) : null,
      aulasAtual: dados.atual.aulas,
      faltasAtual: dados.atual.faltas,
      aulasAnterior: dados.anterior.aulas,
      faltasAnterior: dados.anterior.faltas,
    });
  }

  return resultado.sort((a, b) => (a.percentualAtual ?? 100) - (b.percentualAtual ?? 100));
}

/**
 * Janela padrão de comparação: últimos 30 dias vs. os 30 dias anteriores a
 * esses. É um recorte simples e sem dependência de calendário letivo
 * (bimestre) porque o sistema ainda não modela bimestres — ver
 * docs/PLANO_DESENVOLVIMENTO.md §8, item 2 (periodicidade oficial ainda não
 * confirmada pela Secretaria).
 */
/**
 * Data de referência para a janela de tendência: "hoje" só faz sentido
 * quando `anoLetivo` é o ano corrente. Para um ano letivo anterior, ancorar
 * em "hoje" comparava frequência de anos passados com uma janela de 30 dias
 * no calendário de hoje — quase sempre vazia. Usa 15/12 do próprio ano
 * letivo como "fim do ano" de referência nesse caso (antes do recesso de
 * fim de ano, quando a maior parte da frequência do ano já foi lançada).
 */
export function resolverDataReferenciaJanela(anoLetivo: number, hoje: Date = new Date()): Date {
  if (anoLetivo === hoje.getFullYear()) return hoje;
  return new Date(`${anoLetivo}-12-15`);
}

export function calcularJanelaComparativaPadrao(hoje: Date, diasPorJanela = 30): JanelaComparativa {
  const paraIso = (data: Date) => data.toISOString().slice(0, 10);
  const subDias = (data: Date, dias: number) => new Date(data.getTime() - dias * 24 * 60 * 60 * 1000);

  const atualFim = hoje;
  const atualInicio = subDias(atualFim, diasPorJanela - 1);
  const anteriorFim = subDias(atualInicio, 1);
  const anteriorInicio = subDias(anteriorFim, diasPorJanela - 1);

  return {
    atualInicio: paraIso(atualInicio),
    atualFim: paraIso(atualFim),
    anteriorInicio: paraIso(anteriorInicio),
    anteriorFim: paraIso(anteriorFim),
  };
}
