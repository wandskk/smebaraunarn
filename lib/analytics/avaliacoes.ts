/**
 * Regras puras (sem Prisma/I/O) para o módulo de Avaliações Municipais —
 * mesmo princípio de lib/analytics/*: testável com node:test, reutilizável
 * por Admin/Diretor/Professor sem duplicar a fórmula em cada tela.
 */

export type StatusAvaliacao = "preparacao" | "em_aplicacao" | "coleta_parcial" | "consolidada";

export const STATUS_AVALIACAO_LABEL: Record<StatusAvaliacao, string> = {
  preparacao: "Preparação",
  em_aplicacao: "Em aplicação",
  coleta_parcial: "Coleta parcial",
  consolidada: "Consolidada",
};

export interface CoberturaAvaliacao {
  esperado: number;
  realizado: number;
  turmasCompletas: number;
  turmasParciais: number;
}

/**
 * Status é derivado, não persistido — não há campo de "situação" no schema
 * e não há data de início/fim de aplicação. A regra é uma heurística
 * explicável a partir da cobertura já calculada (nunca um score opaco):
 *
 * - nenhum resultado ainda            -> Preparação
 * - resultados, mas nenhuma turma completa -> Em aplicação (aplicação em curso)
 * - alguma turma completa e outra não -> Coleta parcial
 * - todas as turmas tocadas completas -> Consolidada
 */
export function deriveStatusAvaliacao(cobertura: CoberturaAvaliacao): StatusAvaliacao {
  if (cobertura.realizado === 0) return "preparacao";
  if (cobertura.turmasCompletas === 0) return "em_aplicacao";
  if (cobertura.turmasParciais > 0) return "coleta_parcial";
  return "consolidada";
}

export interface RespostaItemInput {
  /** Chave = número da questão (mesmo valor de AvaliacaoQuestao.numero), como string. */
  respostasJson: Record<string, string> | null;
}

export interface QuestaoParaAnalise {
  numero: number;
  descritor: string | null;
  gabaritoCorreto: string | null;
}

export interface AnaliseItemResultado {
  numero: number;
  descritor: string | null;
  respondidas: number;
  acertos: number;
  /** null quando nenhum resultado respondeu esta questão. */
  percentualAcerto: number | null;
}

export interface AnaliseDescritorResultado {
  descritor: string;
  respondidas: number;
  acertos: number;
  percentualAcerto: number | null;
}

/**
 * % de acerto por questão (e agregado por descritor) a partir de
 * respostasJson dos resultados + gabarito das questões. Só produz números
 * para questões com gabarito cadastrado — sem gabarito não há "acerto" a
 * calcular, e o item aparece com respondidas/acertos = 0 e percentual null
 * em vez de um número inventado.
 */
export function calcularAnalisePorItem(
  questoes: QuestaoParaAnalise[],
  resultados: RespostaItemInput[],
): { porQuestao: AnaliseItemResultado[]; porDescritor: AnaliseDescritorResultado[] } {
  const porQuestao: AnaliseItemResultado[] = questoes
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((q) => {
      if (!q.gabaritoCorreto) {
        return { numero: q.numero, descritor: q.descritor, respondidas: 0, acertos: 0, percentualAcerto: null };
      }
      let respondidas = 0;
      let acertos = 0;
      for (const r of resultados) {
        const resposta = r.respostasJson?.[String(q.numero)];
        if (resposta === undefined || resposta === null || resposta === "") continue;
        respondidas++;
        if (resposta.trim().toUpperCase() === q.gabaritoCorreto.trim().toUpperCase()) acertos++;
      }
      return {
        numero: q.numero,
        descritor: q.descritor,
        respondidas,
        acertos,
        percentualAcerto: respondidas > 0 ? (acertos / respondidas) * 100 : null,
      };
    });

  const porDescritorMap = new Map<string, { respondidas: number; acertos: number }>();
  for (const item of porQuestao) {
    if (!item.descritor) continue;
    const atual = porDescritorMap.get(item.descritor) ?? { respondidas: 0, acertos: 0 };
    atual.respondidas += item.respondidas;
    atual.acertos += item.acertos;
    porDescritorMap.set(item.descritor, atual);
  }

  const porDescritor: AnaliseDescritorResultado[] = Array.from(porDescritorMap.entries())
    .map(([descritor, v]) => ({
      descritor,
      respondidas: v.respondidas,
      acertos: v.acertos,
      percentualAcerto: v.respondidas > 0 ? (v.acertos / v.respondidas) * 100 : null,
    }))
    .sort((a, b) => a.descritor.localeCompare(b.descritor));

  return { porQuestao, porDescritor };
}

export interface ResultadoFluenciaInput {
  nivelDesempenho: string | null;
  palavrasPorMin: number | null;
}

export interface DistribuicaoNivelFluencia {
  nivel: string;
  quantidade: number;
}

export interface EstatisticasPalavrasPorMinuto {
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  /** Quantos resultados têm palavras/minuto registrado — nem toda aplicação mede isso. */
  totalComDado: number;
}

export interface DistribuicaoFluencia {
  porNivel: DistribuicaoNivelFluencia[];
  /** Resultados com nível não preenchido — não descartados silenciosamente. */
  semNivel: number;
  palavrasPorMinuto: EstatisticasPalavrasPorMinuto;
}

/**
 * Distribuição de resultados de Fluência Leitora por nível + estatísticas
 * de palavras/minuto — agregado, nunca lista/ranking de estudante (seção
 * 14 do plano). `niveisOrdenados` vem do chamador (mesmo padrão de
 * `calcularHistograma`: a função pura não conhece o enum `NivelFluencia`
 * do Prisma, só recebe a ordem já pronta).
 */
export function calcularDistribuicaoFluencia(
  resultados: ResultadoFluenciaInput[],
  niveisOrdenados: string[],
): DistribuicaoFluencia {
  const contagemPorNivel = new Map<string, number>();
  let semNivel = 0;
  const valoresPalavrasPorMin: number[] = [];

  for (const r of resultados) {
    if (r.nivelDesempenho) {
      contagemPorNivel.set(r.nivelDesempenho, (contagemPorNivel.get(r.nivelDesempenho) ?? 0) + 1);
    } else {
      semNivel += 1;
    }
    if (r.palavrasPorMin !== null) valoresPalavrasPorMin.push(r.palavrasPorMin);
  }

  const porNivel = niveisOrdenados.map((nivel) => ({ nivel, quantidade: contagemPorNivel.get(nivel) ?? 0 }));

  const palavrasPorMinuto: EstatisticasPalavrasPorMinuto =
    valoresPalavrasPorMin.length > 0
      ? {
          media: valoresPalavrasPorMin.reduce((acc, v) => acc + v, 0) / valoresPalavrasPorMin.length,
          minimo: Math.min(...valoresPalavrasPorMin),
          maximo: Math.max(...valoresPalavrasPorMin),
          totalComDado: valoresPalavrasPorMin.length,
        }
      : { media: null, minimo: null, maximo: null, totalComDado: 0 };

  return { porNivel, semNivel, palavrasPorMinuto };
}

export interface ResultadoTurmaInput {
  escolaId: number;
  escolaNome: string;
  turma: string;
  percentualParticipacao: number | null;
  percentualDefasagem: number | null;
  percentualIntermediario: number | null;
  percentualAdequado: number | null;
  acertoPorHabilidade: Record<string, number> | null;
}

export interface ResumoHabilidadeTurma {
  habilidade: string;
  percentualMedioAcerto: number;
}

export interface ResumoResultadosTurma {
  porEscola: ResultadoTurmaInput[];
  mediaParticipacao: number | null;
  mediaDefasagem: number | null;
  mediaIntermediario: number | null;
  mediaAdequado: number | null;
  /** Média do % de acerto de cada habilidade através das linhas que a reportaram — vazio quando a fonte não traz essa quebra. */
  porHabilidade: ResumoHabilidadeTurma[];
}

function media(valores: (number | null)[]): number | null {
  const validos = valores.filter((v): v is number => v !== null);
  return validos.length > 0 ? validos.reduce((soma, v) => soma + v, 0) / validos.length : null;
}

/**
 * Agrega indicadores de `AvaliacaoResultadoTurma` — fontes externas que só
 * publicam no nível de turma/escola (ex.: CAEd/Criança Alfabetizada), sem
 * identificar aluno. Médias são simples entre as linhas (sem ponderar por
 * matriculados, que esse modelo não guarda) — suficiente para apontar onde
 * investigar, nunca uma nota oficial da rede.
 */
export function calcularResumoResultadosTurma(linhas: ResultadoTurmaInput[]): ResumoResultadosTurma {
  const porHabilidadeMap = new Map<string, number[]>();
  for (const linha of linhas) {
    if (!linha.acertoPorHabilidade) continue;
    for (const [habilidade, percentual] of Object.entries(linha.acertoPorHabilidade)) {
      if (!porHabilidadeMap.has(habilidade)) porHabilidadeMap.set(habilidade, []);
      porHabilidadeMap.get(habilidade)!.push(percentual);
    }
  }
  const porHabilidade: ResumoHabilidadeTurma[] = Array.from(porHabilidadeMap.entries())
    .map(([habilidade, percentuais]) => ({
      habilidade,
      percentualMedioAcerto: percentuais.reduce((soma, v) => soma + v, 0) / percentuais.length,
    }))
    .sort((a, b) => a.habilidade.localeCompare(b.habilidade));

  return {
    porEscola: [...linhas].sort((a, b) => a.escolaNome.localeCompare(b.escolaNome) || a.turma.localeCompare(b.turma)),
    mediaParticipacao: media(linhas.map((l) => l.percentualParticipacao)),
    mediaDefasagem: media(linhas.map((l) => l.percentualDefasagem)),
    mediaIntermediario: media(linhas.map((l) => l.percentualIntermediario)),
    mediaAdequado: media(linhas.map((l) => l.percentualAdequado)),
    porHabilidade,
  };
}
