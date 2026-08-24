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
