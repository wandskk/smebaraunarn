import { prisma } from "@/lib/prisma";
import { normalizeCpf } from "@/lib/utils";
import { NIVEL_FLUENCIA_LABEL } from "@/lib/queries/avaliacoes";
import type { NivelFluencia } from "@prisma/client";
import type { LinhaTabular } from "./parse-tabular";

/**
 * Motor de importação em lote (CSV/XLSX) de questões e resultados de
 * Avaliações Municipais — ETAPA 10 rodada 2. Separado em duas camadas:
 *
 * - Validação de QUESTÕES é pura (sem I/O) e testável isoladamente; só
 *   precisa checar duplicidade dentro do próprio arquivo — duplicidade
 *   contra o banco é responsabilidade de quem chama no momento do commit
 *   (mesma checagem já usada em `addQuestaoAction`/`updateQuestaoAction`).
 * - Resolução de RESULTADOS precisa de banco (achar o estudante) e por
 *   isso não é pura; a parte de extrair `respostasJson`/nível a partir de
 *   texto livre é isolada em funções puras testáveis separadamente.
 */

// ---------------------------------------------------------------------------
// Questões
// ---------------------------------------------------------------------------

export interface QuestaoImportada {
  /** Número da linha no arquivo original (1 = primeira linha de dado, após o cabeçalho). */
  linha: number;
  numero: number | null;
  descritor: string | null;
  gabaritoCorreto: string | null;
  peso: number;
  enunciado: string | null;
  /** null quando a linha é válida. */
  erro: string | null;
}

const CHAVES_NUMERO = ["numero", "n", "no", "nº", "num"];
const CHAVES_GABARITO = ["gabarito", "gabaritocorreto", "resposta_correta", "respostacorreta"];

function lerPrimeiraChave(linha: LinhaTabular, chaves: string[]): string {
  for (const chave of chaves) {
    if (linha[chave]) return linha[chave]!;
  }
  return "";
}

/**
 * Valida linhas de questão vindas do arquivo — só checa consistência
 * interna ao arquivo (número presente/inteiro/único, peso numérico).
 * Colisão com questões já cadastradas na avaliação é checada à parte no
 * momento do commit (precisa do banco).
 */
export function validarLinhasQuestao(linhas: LinhaTabular[]): QuestaoImportada[] {
  const numerosVistos = new Set<number>();

  return linhas.map((linha, indice) => {
    const numeroTexto = lerPrimeiraChave(linha, CHAVES_NUMERO);
    const numero = Number(numeroTexto);
    const numeroValido = numeroTexto !== "" && Number.isInteger(numero) && numero >= 1;

    const pesoTexto = linha.peso ?? "";
    const peso = pesoTexto === "" ? 1 : Number(pesoTexto);
    const pesoValido = pesoTexto === "" || (!Number.isNaN(peso) && peso >= 0);

    let erro: string | null = null;
    if (!numeroValido) {
      erro = "Número da questão ausente ou inválido.";
    } else if (numerosVistos.has(numero)) {
      erro = `Número ${numero} duplicado dentro do próprio arquivo.`;
    } else if (!pesoValido) {
      erro = "Peso inválido (deve ser um número ≥ 0).";
    }
    if (numeroValido && !numerosVistos.has(numero)) numerosVistos.add(numero);

    return {
      linha: indice + 1,
      numero: numeroValido ? numero : null,
      descritor: linha.descritor || null,
      gabaritoCorreto: lerPrimeiraChave(linha, CHAVES_GABARITO) || null,
      peso: pesoValido ? peso : 1,
      enunciado: linha.enunciado || null,
      erro,
    };
  });
}

// ---------------------------------------------------------------------------
// Resultados — utilitários puros (nível, respostas por item)
// ---------------------------------------------------------------------------

const NIVEL_POR_LABEL_OU_VALOR: Record<string, NivelFluencia> = Object.fromEntries([
  ...Object.entries(NIVEL_FLUENCIA_LABEL).map(([valor]) => [valor.toLowerCase(), valor as NivelFluencia]),
  ...Object.entries(NIVEL_FLUENCIA_LABEL).map(([valor, label]) => [label.toLowerCase(), valor as NivelFluencia]),
]);

/**
 * Aceita tanto o valor bruto do enum (`LEITOR_FLUENTE`) quanto o rótulo em
 * português (`Leitor fluente`) — o arquivo de origem pode vir com
 * qualquer um dos dois. Texto vazio ou não reconhecido vira `null` (nunca
 * lança), quem chama decide se isso é um erro de linha.
 */
export function interpretarNivelFluencia(texto: string): NivelFluencia | null {
  const chave = texto.trim().toLowerCase();
  if (!chave) return null;
  return NIVEL_POR_LABEL_OU_VALOR[chave] ?? null;
}

const PREFIXOS_COLUNA_RESPOSTA = ["resposta_", "questao_", "q"];

/**
 * Extrai respostas por item das colunas cujo nome bate com um dos
 * prefixos reconhecidos + um número (`resposta_1`, `questao_12`, `q3`).
 * Chave do resultado = número da questão como string, igual ao usado pelo
 * lançamento manual (`ResultadoForm`) e por `calcularAnalisePorItem`.
 */
export function extrairRespostasPorItem(linha: LinhaTabular): Record<string, string> {
  const respostas: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(linha)) {
    if (!valor) continue;
    for (const prefixo of PREFIXOS_COLUNA_RESPOSTA) {
      if (!chave.startsWith(prefixo)) continue;
      const numero = chave.slice(prefixo.length);
      if (/^\d+$/.test(numero)) {
        respostas[numero] = valor.trim();
        break;
      }
    }
  }
  return respostas;
}

// ---------------------------------------------------------------------------
// Resultados — resolução de estudante e validação (precisa do banco)
// ---------------------------------------------------------------------------

export type StatusResultadoImportado = "ok" | "nao_encontrado" | "ambiguo" | "erro_dado";

export interface ResultadoImportado {
  linha: number;
  /** O que foi usado para tentar identificar o estudante — só para exibir no preview. */
  identificadorUsado: string;
  estudanteId: number | null;
  nomeEstudante: string | null;
  escolaId: number | null;
  turma: string | null;
  pontuacao: number | null;
  nivelDesempenho: NivelFluencia | null;
  palavrasPorMin: number | null;
  observacoes: string | null;
  respostasJson: Record<string, string> | null;
  status: StatusResultadoImportado;
  /** Explica o status quando não é "ok" (ex.: quantos candidatos ambíguos, ou qual campo é inválido). */
  detalhe: string | null;
}

interface EstudanteResumo {
  id: number;
  nome: string;
  escolaId: number;
  turmaSerie: string | null;
}

/**
 * Normaliza um nome para comparação tolerante a acento (maiúsculo, sem
 * diacríticos, espaços colapsados) — usado só como critério de *fallback*
 * quando a busca exata falhar, nunca para a busca principal (index-friendly).
 */
export function normalizarNomeComparacao(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve o estudante de uma linha por matrícula, CPF, ou (nome + escola
 * opcionalmente + turma) — nessa ordem de prioridade. Nome sozinho, sem
 * nenhum outro dado, tende a ser ambíguo numa rede de milhares de alunos;
 * por isso aceita escola/turma como desempate, mas não exige.
 */
async function resolverEstudante(linha: LinhaTabular): Promise<{ candidatos: EstudanteResumo[]; identificador: string }> {
  const matricula = (linha.matricula ?? "").trim();
  if (matricula) {
    const estudante = await prisma.estudante.findUnique({
      where: { matricula },
      select: { id: true, nome: true, escolaId: true, turmaSerie: true },
    });
    return { candidatos: estudante ? [estudante] : [], identificador: `matrícula ${matricula}` };
  }

  const cpfTexto = (linha.cpf ?? "").trim();
  if (cpfTexto) {
    const estudante = await prisma.estudante.findFirst({
      where: { cpf: normalizeCpf(cpfTexto) },
      select: { id: true, nome: true, escolaId: true, turmaSerie: true },
    });
    return { candidatos: estudante ? [estudante] : [], identificador: `CPF ${cpfTexto}` };
  }

  const nome = (linha.nome ?? "").trim();
  if (!nome) return { candidatos: [], identificador: "(nenhum identificador informado)" };

  const escolaTexto = (linha.escola ?? "").trim();
  const turmaTexto = (linha.turma ?? "").trim();

  let escolaId: number | undefined;
  if (escolaTexto) {
    const escola = await prisma.escola.findFirst({
      where: { nome: { equals: escolaTexto, mode: "insensitive" } },
      select: { id: true },
    });
    escolaId = escola?.id;
  }

  let candidatos = await prisma.estudante.findMany({
    where: {
      nome: { equals: nome, mode: "insensitive" },
      ...(escolaId ? { escolaId } : {}),
      ...(turmaTexto ? { turmaSerie: turmaTexto } : {}),
    },
    select: { id: true, nome: true, escolaId: true, turmaSerie: true },
  });

  // Fallback só quando a escola é conhecida (nunca busca acento-insensível
  // rede inteira, pra não arriscar casar com aluno de outra escola por
  // coincidência de nome) — a busca exata acima falha em fontes externas
  // (ex.: CAEd) que às vezes divergem só na acentuação do nosso cadastro.
  if (candidatos.length === 0 && escolaId) {
    const doEscopo = await prisma.estudante.findMany({
      where: { escolaId, ...(turmaTexto ? { turmaSerie: turmaTexto } : {}) },
      select: { id: true, nome: true, escolaId: true, turmaSerie: true },
    });
    const alvo = normalizarNomeComparacao(nome);
    candidatos = doEscopo.filter((e) => normalizarNomeComparacao(e.nome) === alvo);
  }

  const partes = [nome, escolaTexto && `escola "${escolaTexto}"`, turmaTexto && `turma "${turmaTexto}"`].filter(Boolean);
  return { candidatos, identificador: partes.join(" · ") };
}

/**
 * Valida + resolve todas as linhas de resultado de um arquivo. Não grava
 * nada — só usado na etapa de preview e reaproveitado (com as mesmas
 * linhas) no commit, para nunca gravar uma linha que não passou por aqui.
 * Uma consulta por linha (não em lote) — simples e correto; o volume
 * esperado (lançamento de uma avaliação por vez) não justifica a
 * complexidade de agrupar antecipadamente.
 */
export async function validarLinhasResultado(linhas: LinhaTabular[]): Promise<ResultadoImportado[]> {
  const resultado: ResultadoImportado[] = [];

  for (const [indice, linha] of linhas.entries()) {
    const { candidatos, identificador } = await resolverEstudante(linha);

    const pontuacaoTexto = (linha.pontuacao ?? "").trim();
    const pontuacao = pontuacaoTexto === "" ? null : Number(pontuacaoTexto);
    const pontuacaoValida = pontuacaoTexto === "" || !Number.isNaN(pontuacao);

    const palavrasTexto = (linha.palavras_por_min ?? linha.palavraspormin ?? linha.ppm ?? "").trim();
    const palavrasPorMin = palavrasTexto === "" ? null : Number(palavrasTexto);
    const palavrasValidas = palavrasTexto === "" || (!Number.isNaN(palavrasPorMin) && Number.isInteger(palavrasPorMin));

    const nivelTexto = (linha.nivel ?? linha.nivel_desempenho ?? linha.niveldesempenho ?? "").trim();
    const nivelDesempenho = nivelTexto ? interpretarNivelFluencia(nivelTexto) : null;
    const nivelValido = !nivelTexto || nivelDesempenho !== null;

    const turmaTexto = (linha.turma ?? "").trim();
    const respostasJson = extrairRespostasPorItem(linha);

    let status: StatusResultadoImportado;
    let detalhe: string | null = null;

    if (candidatos.length === 0) {
      status = "nao_encontrado";
      detalhe = "Nenhum estudante encontrado com esse identificador.";
    } else if (candidatos.length > 1) {
      status = "ambiguo";
      detalhe = `${candidatos.length} estudantes encontrados com esse nome — informe escola/turma para desambiguar, ou use matrícula/CPF.`;
    } else if (!pontuacaoValida || !palavrasValidas || !nivelValido) {
      status = "erro_dado";
      detalhe = [
        !pontuacaoValida && "pontuação inválida",
        !palavrasValidas && "palavras/min inválido",
        !nivelValido && `nível "${nivelTexto}" não reconhecido`,
      ]
        .filter(Boolean)
        .join("; ");
    } else if (!turmaTexto && !candidatos[0]!.turmaSerie) {
      status = "erro_dado";
      detalhe = "Sem turma informada no arquivo nem cadastrada para o estudante.";
    } else {
      status = "ok";
    }

    const estudante = candidatos.length === 1 ? candidatos[0]! : null;

    resultado.push({
      linha: indice + 1,
      identificadorUsado: identificador,
      estudanteId: estudante?.id ?? null,
      nomeEstudante: estudante?.nome ?? null,
      escolaId: estudante?.escolaId ?? null,
      turma: turmaTexto || estudante?.turmaSerie || null,
      pontuacao: pontuacaoValida && pontuacaoTexto !== "" ? pontuacao : null,
      nivelDesempenho,
      palavrasPorMin: palavrasValidas && palavrasTexto !== "" ? palavrasPorMin : null,
      observacoes: linha.observacoes || null,
      respostasJson: Object.keys(respostasJson).length > 0 ? respostasJson : null,
      status,
      detalhe,
    });
  }

  return resultado;
}

/**
 * Grava (upsert) as linhas com status "ok" de uma avaliação — mesma
 * semântica de `registrarResultadoAction` (upsert por avaliacaoId+estudanteId),
 * só que em lote. Retorna quantas linhas foram de fato gravadas.
 */
export async function commitResultadosImportados(avaliacaoId: string, linhas: ResultadoImportado[]): Promise<number> {
  const validas = linhas.filter((l) => l.status === "ok" && l.estudanteId !== null && l.escolaId !== null && l.turma !== null);

  for (const linha of validas) {
    await prisma.avaliacaoResultadoAluno.upsert({
      where: { avaliacaoId_estudanteId: { avaliacaoId, estudanteId: linha.estudanteId! } },
      update: {
        turma: linha.turma!,
        pontuacao: linha.pontuacao,
        nivelDesempenho: linha.nivelDesempenho,
        palavrasPorMin: linha.palavrasPorMin,
        observacoes: linha.observacoes,
        ...(linha.respostasJson ? { respostasJson: linha.respostasJson } : {}),
      },
      create: {
        avaliacaoId,
        estudanteId: linha.estudanteId!,
        escolaId: linha.escolaId!,
        turma: linha.turma!,
        pontuacao: linha.pontuacao,
        nivelDesempenho: linha.nivelDesempenho,
        palavrasPorMin: linha.palavrasPorMin,
        observacoes: linha.observacoes,
        respostasJson: linha.respostasJson ?? undefined,
      },
    });
  }

  return validas.length;
}

export interface ResultadoNaoVinculado {
  escolaId: number;
  nomeBruto: string;
}

/**
 * Grava resultados de fontes externas (ex.: CAEd) cujo nome não bateu com
 * nenhum Estudante do nosso cadastro — sem `estudanteId`, para não perder a
 * estatística que a fonte original tem (participação/nível por nome), só
 * sem o vínculo. `escolaId` continua conhecido (resolvido pela fonte
 * independente do match de aluno); `turma` fica null porque, sem Estudante,
 * não há `turmaSerie` a copiar.
 *
 * Sem chave única de banco pra (avaliacaoId, escolaId, nomeBruto) — `estudanteId`
 * null não serve de chave (Postgres trata cada NULL como distinto) — por
 * isso o dedup é feito aqui, uma consulta por linha, pra reimportação não
 * duplicar a mesma linha sem vínculo.
 */
export async function commitResultadosNaoVinculados(avaliacaoId: string, linhas: ResultadoNaoVinculado[]): Promise<number> {
  let gravados = 0;
  for (const linha of linhas) {
    const existente = await prisma.avaliacaoResultadoAluno.findFirst({
      where: { avaliacaoId, estudanteId: null, escolaId: linha.escolaId, nomeBruto: linha.nomeBruto },
      select: { id: true },
    });
    if (existente) continue;
    await prisma.avaliacaoResultadoAluno.create({
      data: { avaliacaoId, escolaId: linha.escolaId, nomeBruto: linha.nomeBruto },
    });
    gravados++;
  }
  return gravados;
}

/**
 * Grava as linhas de questão válidas (sem `erro`) que ainda não colidem
 * com um número já cadastrado na avaliação. Mesma regra de
 * `addQuestaoAction`: número duplicado é rejeitado, não sobrescrito.
 */
export async function commitQuestoesImportadas(avaliacaoId: string, linhas: QuestaoImportada[]): Promise<{ criadas: number; ignoradasPorDuplicidade: number[] }> {
  const existentes = await prisma.avaliacaoQuestao.findMany({ where: { avaliacaoId }, select: { numero: true } });
  const numerosExistentes = new Set(existentes.map((q) => q.numero));

  let criadas = 0;
  const ignoradasPorDuplicidade: number[] = [];

  for (const linha of linhas) {
    if (linha.erro || linha.numero === null) continue;
    if (numerosExistentes.has(linha.numero)) {
      ignoradasPorDuplicidade.push(linha.numero);
      continue;
    }
    await prisma.avaliacaoQuestao.create({
      data: {
        avaliacaoId,
        numero: linha.numero,
        enunciado: linha.enunciado,
        descritor: linha.descritor,
        gabaritoCorreto: linha.gabaritoCorreto,
        peso: linha.peso,
      },
    });
    numerosExistentes.add(linha.numero);
    criadas++;
  }

  return { criadas, ignoradasPorDuplicidade };
}
