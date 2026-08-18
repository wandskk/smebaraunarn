/**
 * Motor puro de explicabilidade de indicadores.
 *
 * Princípio (ver centro_indicadores_educacionais.md §36 e §35): nenhum
 * número importante deve ser exibido sem poder responder de onde veio,
 * quando foi atualizado, qual fórmula foi usada e quais filtros/período
 * estão ativos. Este módulo dá um formato único para essa "ficha técnica" e
 * uma função que a transforma em texto pronto para tooltip — sem I/O, sem
 * depender de Date.now() (data de atualização é sempre recebida como
 * parâmetro, nunca lida do relógio, para manter a função pura e testável).
 */

/** Metadados fixos de um indicador — a parte que não muda a cada consulta. */
export interface FichaIndicador {
  nome: string;
  objetivo: string;
  fonte: string;
  formula: string;
  periodicidade: string;
  granularidade: string;
  limitacoes?: string[];
  responsavelValidacao?: string;
}

/** Contexto de uma exibição específica — a parte que muda a cada consulta/tela. */
export interface ContextoExibicao {
  /** Data/hora da última sincronização que alimenta o valor exibido (ISO). */
  dataAtualizacao: string;
  /** Ex.: { escola: "EMEF Centro", turma: "6º Ano A", ano: "2026" }. */
  filtrosAtivos?: Record<string, string>;
  periodoAnalisado?: string;
}

function validarFicha(ficha: FichaIndicador): void {
  const camposObrigatorios: (keyof FichaIndicador)[] = [
    "nome",
    "objetivo",
    "fonte",
    "formula",
    "periodicidade",
    "granularidade",
  ];
  for (const campo of camposObrigatorios) {
    if (!ficha[campo] || String(ficha[campo]).trim() === "") {
      throw new Error(`Ficha de indicador inválida: campo "${campo}" é obrigatório.`);
    }
  }
}

/**
 * Monta e valida uma ficha técnica de indicador. Lança erro se algum campo
 * obrigatório estiver vazio — preferível a exibir um indicador sem
 * explicabilidade completa.
 */
export function montarFichaIndicador(ficha: FichaIndicador): FichaIndicador {
  validarFicha(ficha);
  return ficha;
}

/**
 * Combina a ficha técnica com o contexto de exibição em um texto único,
 * pronto para um tooltip/rodapé de indicador.
 */
export function descreverContexto(ficha: FichaIndicador, contexto: ContextoExibicao): string {
  validarFicha(ficha);

  const linhas = [
    `${ficha.nome}: ${ficha.objetivo}`,
    `Fórmula: ${ficha.formula}`,
    `Fonte: ${ficha.fonte}`,
    `Granularidade: ${ficha.granularidade}`,
    `Atualizado em: ${contexto.dataAtualizacao}`,
  ];

  if (contexto.periodoAnalisado) linhas.push(`Período analisado: ${contexto.periodoAnalisado}`);

  if (contexto.filtrosAtivos && Object.keys(contexto.filtrosAtivos).length > 0) {
    const filtros = Object.entries(contexto.filtrosAtivos)
      .map(([chave, valor]) => `${chave}: ${valor}`)
      .join(", ");
    linhas.push(`Filtros ativos: ${filtros}`);
  }

  if (ficha.limitacoes && ficha.limitacoes.length > 0) {
    linhas.push(`Limitações conhecidas: ${ficha.limitacoes.join("; ")}`);
  }

  return linhas.join("\n");
}

export type ChaveIndicador =
  | "frequenciaMedia"
  | "estudantesAbaixoFaixaFrequencia"
  | "faltasConsecutivas"
  | "distorcaoIdadeSerie"
  | "desempenhoMedio"
  | "escolasAtivas";

/**
 * Dicionário de indicadores (ver centro_indicadores_educacionais.md §35).
 * Começa com os indicadores cujo motor de cálculo já existe
 * (lib/analytics/frequencia.ts, lib/analytics/distorcao.ts). Novas entradas
 * devem ser adicionadas junto com o motor de cálculo correspondente, nunca
 * antes — a ficha descreve código que existe, não uma promessa futura.
 * Chave tipada como união literal (não `string`) para que o acesso por
 * ponto em qualquer indicador conhecido não precise de checagem de
 * undefined em cada callsite.
 */
export const DICIONARIO_INDICADORES: Readonly<Record<ChaveIndicador, FichaIndicador>> = {
  frequenciaMedia: {
    nome: "Frequência média",
    objetivo: "Acompanhar a presença escolar de um estudante, turma, escola ou da rede.",
    fonte: "Sincronização SIGEduc (frequência por disciplina/aula, agregada por dia).",
    formula: "(Total de aulas − Total de faltas) / Total de aulas × 100, no período selecionado.",
    periodicidade: "Diária, conforme sincronização automática (Vercel Cron).",
    granularidade: "Rede / Escola / Etapa / Série / Turma / Estudante.",
    limitacoes: [
      "Depende da regularidade do lançamento de frequência pela escola de origem no SIGEduc.",
    ],
  },
  estudantesAbaixoFaixaFrequencia: {
    nome: "Estudantes abaixo da faixa adequada de frequência",
    objetivo: "Dimensionar quantos estudantes precisam de atenção quanto à frequência, não só a média da rede.",
    fonte: "Sincronização SIGEduc (frequência por disciplina/aula, agregada por estudante no período).",
    formula:
      "Contagem de estudantes cujo percentual de frequência individual no período fica abaixo do limite mínimo da faixa 'adequada'.",
    periodicidade: "Diária, conforme sincronização automática (Vercel Cron).",
    granularidade: "Rede / Escola / Turma.",
    limitacoes: [
      "Faixas de frequência (adequada/atenção/crítica) ainda não confirmadas oficialmente pela Secretaria — ver docs/PLANO_DESENVOLVIMENTO.md §8, item 2.",
    ],
  },
  faltasConsecutivas: {
    nome: "Faltas consecutivas",
    objetivo: "Identificar sequências de dias letivos seguidos com falta, para intervenção antes do abandono.",
    fonte: "Sincronização SIGEduc (frequência), agregada por dia.",
    formula:
      "Contagem de dias letivos consecutivos (sem dia de presença no meio) com falta, classificada em faixas (padrão: 3/5/10 dias).",
    periodicidade: "Diária, conforme sincronização automática (Vercel Cron).",
    granularidade: "Estudante.",
    limitacoes: ["'Consecutivo' considera apenas dias letivos com registro; feriados e recessos não interrompem nem estendem a contagem."],
  },
  distorcaoIdadeSerie: {
    nome: "Distorção idade-série",
    objetivo: "Identificar estudantes com defasagem entre idade e série cursada.",
    fonte: "Cadastro de estudantes (data de nascimento) + enturmação, via SIGEduc.",
    formula: "Idade do estudante na data de referência − idade esperada para a série; distorção quando a diferença ≥ 2 anos (metodologia INEP).",
    periodicidade: "Recalculado a cada sincronização; data de referência é definida por consulta (ex.: 31/03 do ano letivo).",
    granularidade: "Rede / Escola / Etapa / Série / Estudante.",
    limitacoes: [
      "Limiar de 2 anos e data de referência ainda não confirmados formalmente pela Secretaria para o município (ver docs/PLANO_DESENVOLVIMENTO.md §8.1).",
      "Não se aplica à Educação Infantil, EJA, Educação Especial, turmas multianuais nem à trilha 'Trajetória de Sucesso', por não terem uma única idade esperada bem definida.",
      "Como a rede já direciona parte dos estudantes em defasagem para a trilha 'Trajetória de Sucesso' (fora do escopo deste cálculo), o número contado nas turmas regulares é um piso, não o total real de estudantes em distorção na rede.",
    ],
    responsavelValidacao: "Secretaria Municipal de Educação (a confirmar).",
  },
  desempenhoMedio: {
    nome: "Desempenho médio",
    objetivo: "Acompanhar o nível geral de aprendizagem de uma turma, escola ou da rede.",
    fonte: "Sincronização SIGEduc (notas por disciplina/unidade).",
    formula: "Média aritmética simples de todas as notas lançadas no período selecionado.",
    periodicidade: "Conforme lançamento de notas pela escola de origem no SIGEduc.",
    granularidade: "Rede / Escola / Turma / Disciplina / Estudante.",
    limitacoes: [
      "Média simples entre lançamentos — turmas/estudantes com mais notas lançadas pesam mais no valor agregado. Distribuição (mediana, percentis) fica para uma etapa futura (ver docs/PLANO_DESENVOLVIMENTO.md, Etapa E7).",
    ],
  },
  escolasAtivas: {
    nome: "Escolas ativas",
    objetivo: "Contar quantas escolas da rede têm operação corrente (matrículas no ano letivo).",
    fonte: "Cadastro de estudantes (matrícula por escola), via SIGEduc.",
    formula: "Quantidade de escolas distintas com ao menos 1 estudante matriculado no ano letivo selecionado.",
    periodicidade: "Recalculado a cada sincronização.",
    granularidade: "Rede.",
    limitacoes: [
      "Definição operacional: o cadastro de Escola não tem um campo de 'ativa/inativa' próprio; 'ativa' aqui significa apenas 'com estudante matriculado no ano'.",
    ],
  },
};
