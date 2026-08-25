import { prisma } from "@/lib/prisma";
import {
  calcularJanelaDias,
  calcularPercentualFrequencia,
  calcularVariacaoFrequencia,
  calcularEvolucaoFrequencia,
  classificarFaixaFrequencia,
  faltasConsecutivasAtuais,
  classificarGravidadeFaltasConsecutivas,
  FAIXAS_PADRAO_FREQUENCIA,
  LIMIARES_PADRAO_FALTAS_CONSECUTIVAS,
  type FaixaFrequencia,
  type FaixasFrequencia,
  type VariacaoFrequencia,
  type RegistroDiario,
  type GravidadeFaltasConsecutivas,
  type PontoEvolucaoFrequencia,
} from "@/lib/analytics/frequencia";
import { resolverMatriculaPorAno } from "@/lib/queries/distorcao";

/** Janela padrão para detectar sequência de faltas "em andamento agora" — sinal de tempo real, não histórico. */
const DIAS_JANELA_FALTAS_CONSECUTIVAS = 20;

/**
 * Um `RegistroDiario` por (estudante, dia) a partir de `FrequenciaEstudante`
 * — a origem grava por disciplina/aula, várias linhas no mesmo dia; aqui
 * somamos as faltas do dia e consideramos "faltou" quando a soma é > 0.
 * `groupBy` faz essa agregação em uma única query, independente de quantos
 * estudantes/turmas existam na janela.
 */
async function buscarRegistrosDiariosPorJanela(inicio: string, fim: string): Promise<Map<string, RegistroDiario[]>> {
  const linhas = await prisma.frequenciaEstudante.groupBy({
    by: ["estudanteMatricula", "data"],
    where: { data: { gte: inicio, lte: fim } },
    _sum: { falta: true },
  });

  const porMatricula = new Map<string, RegistroDiario[]>();
  for (const l of linhas) {
    const lista = porMatricula.get(l.estudanteMatricula) ?? [];
    lista.push({ data: l.data, faltou: (l._sum.falta ?? 0) > 0 });
    porMatricula.set(l.estudanteMatricula, lista);
  }
  return porMatricula;
}

export interface EstudanteEmSequenciaFaltas {
  estudanteId: number;
  nome: string;
  matricula: string;
  diasConsecutivos: number;
  gravidade: GravidadeFaltasConsecutivas;
}

/**
 * Estudantes de uma turma com sequência de faltas em andamento (dias letivos
 * consecutivos sem presença, motor em lib/analytics/frequencia.ts) — sinal de
 * "agora", não recorte de ano letivo: sempre olha os últimos
 * `DIAS_JANELA_FALTAS_CONSECUTIVAS` dias corridos a partir de hoje. Turmas
 * matriculam pela atribuição ATUAL do estudante (mesma convenção de
 * `getTurmaDetalhe`), não histórica.
 */
export async function getEstudantesEmSequenciaDeFaltas(
  escolaId: number,
  turma: string,
  hoje: Date = new Date(),
): Promise<EstudanteEmSequenciaFaltas[]> {
  const janela = calcularJanelaDias(hoje, DIAS_JANELA_FALTAS_CONSECUTIVAS);
  const [alunos, registrosPorMatricula] = await Promise.all([
    prisma.estudante.findMany({ where: { escolaId, turmaSerie: turma }, select: { id: true, nome: true, matricula: true } }),
    buscarRegistrosDiariosPorJanela(janela.inicio, janela.fim),
  ]);

  const resultado: EstudanteEmSequenciaFaltas[] = [];
  for (const aluno of alunos) {
    const registros = registrosPorMatricula.get(aluno.matricula) ?? [];
    const dias = faltasConsecutivasAtuais(registros);
    const gravidade = classificarGravidadeFaltasConsecutivas(dias);
    if (gravidade === "nenhuma") continue;
    resultado.push({ estudanteId: aluno.id, nome: aluno.nome, matricula: aluno.matricula, diasConsecutivos: dias, gravidade });
  }

  return resultado.sort((a, b) => b.diasConsecutivos - a.diasConsecutivos);
}

export interface ContagemFaltasConsecutivasEscola {
  atencao: number;
  alerta: number;
  critico: number;
  total: number;
}

/**
 * Mesmo motor de `getEstudantesEmSequenciaDeFaltas`, mas para toda a rede de
 * uma vez (usado por `/admin/indicadores/frequencia`) — uma única consulta
 * agregada em vez de uma por escola/turma, mesmo padrão de
 * `somarFrequenciaPorEstudante` abaixo.
 */
export async function getContagemFaltasConsecutivasPorEscola(
  hoje: Date = new Date(),
): Promise<Map<number, ContagemFaltasConsecutivasEscola>> {
  const janela = calcularJanelaDias(hoje, DIAS_JANELA_FALTAS_CONSECUTIVAS);
  const [alunos, registrosPorMatricula] = await Promise.all([
    prisma.estudante.findMany({ select: { matricula: true, escolaId: true } }),
    buscarRegistrosDiariosPorJanela(janela.inicio, janela.fim),
  ]);

  const porEscola = new Map<number, ContagemFaltasConsecutivasEscola>();
  for (const aluno of alunos) {
    const registros = registrosPorMatricula.get(aluno.matricula) ?? [];
    const dias = faltasConsecutivasAtuais(registros);
    const gravidade = classificarGravidadeFaltasConsecutivas(dias);
    if (gravidade === "nenhuma") continue;

    const acumulado = porEscola.get(aluno.escolaId) ?? { atencao: 0, alerta: 0, critico: 0, total: 0 };
    acumulado[gravidade] += 1;
    acumulado.total += 1;
    porEscola.set(aluno.escolaId, acumulado);
  }

  return porEscola;
}

export { LIMIARES_PADRAO_FALTAS_CONSECUTIVAS };

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

export interface FiltroEvolucaoFrequenciaRede {
  /** ISO (YYYY-MM-DD), inclusive. */
  inicio: string;
  /** ISO (YYYY-MM-DD), inclusive. */
  fim: string;
}

/**
 * Série diária de frequência da rede inteira — alimenta o `TimeSeriesChart`
 * da Central e da página de Frequência (ver ETAPA 02 do MVP de
 * Indicadores). Uma única `groupBy` por `data` agregando aulas/faltas de
 * todos os alunos naquele dia; a transformação em percentual/ordenação é
 * pura (`calcularEvolucaoFrequencia`), testável sem banco. Só retorna dias
 * com ao menos uma aula registrada — sem preencher fins de semana/recesso
 * com pontos vazios, então o gráfico não desenha "quedas" artificiais nos
 * dias sem aula.
 */
export async function getEvolucaoFrequenciaRede(filtro: FiltroEvolucaoFrequenciaRede): Promise<PontoEvolucaoFrequencia[]> {
  const linhas = await prisma.frequenciaEstudante.groupBy({
    by: ["data"],
    where: { data: { gte: filtro.inicio, lte: filtro.fim } },
    _sum: { falta: true, quantidadeAula: true },
  });

  return calcularEvolucaoFrequencia(
    linhas.map((l) => ({ data: l.data, aulas: l._sum.quantidadeAula ?? 0, faltas: l._sum.falta ?? 0 })),
  );
}

export function calcularJanelaComparativaPadrao(hoje: Date, diasPorJanela = 30): JanelaComparativa {
  const subDias = (data: Date, dias: number) => new Date(data.getTime() - dias * 24 * 60 * 60 * 1000);

  const atual = calcularJanelaDias(hoje, diasPorJanela);
  const anteriorFim = subDias(new Date(`${atual.inicio}T00:00:00Z`), 1);
  const anterior = calcularJanelaDias(anteriorFim, diasPorJanela);

  return {
    atualInicio: atual.inicio,
    atualFim: atual.fim,
    anteriorInicio: anterior.inicio,
    anteriorFim: anterior.fim,
  };
}
