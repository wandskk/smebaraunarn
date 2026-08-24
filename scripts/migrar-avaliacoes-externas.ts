/**
 * Migração pontual (ETAPA 10, rodada 2) — importa para o SME os dados reais
 * de dois sistemas externos, cujos dumps Postgres o usuário restaurou
 * localmente e cujo conteúdo foi exportado para JSON em
 * scripts/migracao/*.json (ver conversa da ETAPA 10):
 *
 * 1. SPADEB 2026 (barauna-edu-hub): 8 avaliações (uma por série, 2º-9º
 *    Ano), gabarito de 40 questões cada, ~2000 resultados com resposta
 *    item a item.
 * 2. Leitor Fluente Rápido: 1 avaliação com dado real ("Avaliação
 *    Diagnóstica - PARC", 2º Ano), 235 lançamentos de nível de fluência.
 *
 * Reaproveita o MESMO motor de `lib/import/avaliacoes-import.ts` que a
 * tela /admin/avaliacoes/[id]?tab=importar usa — não duplica lógica de
 * validação/matching. Roda em duas fases: primeiro um dry-run (só
 * `validarLinhasResultado`, sem gravar nada) que imprime um relatório de
 * quantos casaram/ficaram ambíguos/não foram encontrados; só grava de
 * verdade quando chamado com `--commit`.
 *
 * Uso:
 *   npx tsx scripts/migrar-avaliacoes-externas.ts            (dry-run)
 *   npx tsx scripts/migrar-avaliacoes-externas.ts --commit    (grava)
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  validarLinhasQuestao,
  validarLinhasResultado,
  commitQuestoesImportadas,
  commitResultadosImportados,
  type ResultadoImportado,
} from "@/lib/import/avaliacoes-import";
import type { LinhaTabular } from "@/lib/import/parse-tabular";

const DIR_EXPORTS =
  "C:\\Users\\wande\\AppData\\Local\\Temp\\claude\\C--Users-wande-Documents-GitHub-smebaraunarn\\c521bd9d-2aac-41dc-9d41-9567a7522a39\\scratchpad\\migracao";

const COMMIT = process.argv.includes("--commit");

function lerJson<T>(nomeArquivo: string): T {
  let texto = fs.readFileSync(path.join(DIR_EXPORTS, nomeArquivo), "utf8");
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
  return JSON.parse(texto) as T;
}

/**
 * Nome do sistema de origem -> nome real de `Escola.nome` na base do SME.
 * Curado manualmente comparando as duas listas (ver conversa da ETAPA 10) —
 * mais confiável que fuzzy-match automático para só ~30 escolas.
 */
const MAPA_ESCOLA_SPADEB: Record<string, string> = {
  "Creche Ana Monteiro Reinaldo - Primavera": "CRECHE ANA MONTEIRO REINALDO",
  "Creche Construindo Nova Vida": "CRECHE MUNICIPAL CONSTRUINDO NOVA VIDA",
  "Escola Amaro Cavalcante - Juremal": "ESCOLA MUNICIPAL DE 1º GRAU AMARO CAVALCANTE",
  "Escola Antônio Florêncio - Florêncio": "ESCOLA MUNICIPAL DE 1º GRAU ANTONIO FLORENCIO",
  "Escola Antonio Martins da Costa - Escada": "ESCOLA MUNICIPAL ANTONIO MARTINS DA COSTA",
  "Escola Higino Roberto - Sumidouro": "ESCOLA MUNICIPAL DE 1º GRAU HIGINO ROBERTO",
  "Escola João Gama- PA Formosa": "ESCOLA MUNICIPAL DE 1º GRAU JOAO GAMA",
  "Escola Manoel Cosme - Velame II": "ESCOLA MUNICIPAL MANOEL COSME",
  "Escola Manoel de Barros - Cidade": "ESCOLA MUNICIPAL DE 1º GRAU MANOEL DE BARROS",
  "Escola Miguel Marques - Santa Maria": "ESCOLA MUNICIPAL DE 1º GRAU MIGUEL MARQUES",
  "Escola Municipal Aprendizado de Angicos - PA Angicos": "CRECHE MUNICIPAL APRENDIZADO DO ANGICOS",
  "Escola Olavo Bilac - Aroeira Grande": "ESCOLA MUNICIPAL DE 1 GRAU OLAVO BILAC",
  "Escola Pedro Fernandes - PA Poço Novo": "ESCOLA MUNICIPAL DE 1º GRAU PEDRO FERNANDES",
  "Escola Porfírio Gabriel dos Anjos - Catingueira": "ESCOLA MUNICIPAL PORFIRO GABRIEL DOS ANJOS",
  "Escola Prof. Amauri Ribeiro da Silva - Cidade": "ESCOLA MUNICIPAL DE 1 GRAU PROF AMAURI R DA SILVA",
  "Escola Profª Maria Barros Feitosa - Cidade": "ESCOLA MUNICIPAL DE 1º GRAU PROFESSORA MARIA BARROS FEITOSA",
  "Escola Profª Maria Lindalva - Formigueiro": "ESCOLA MUNICIPAL PROFª MARIA LINDALVA",
  "Escola Rui Barbosa - Pico Estreito": "ESCOLA MUNICIPAL DE 1º GRAU RUI BARBOSA",
  "Escola Vicente João - Santa Luzia": "ESCOLA MUNICIPAL VICENTE JOAO",
};

const MAPA_ESCOLA_LEITOR_FLUENTE: Record<string, string> = {
  "CRECHE MUNICIPAL CONSTRUINDO NOVA VIDA": "CRECHE MUNICIPAL CONSTRUINDO NOVA VIDA",
  "EM DE 1 GRAU PROF AMAURI RIBEIRO DA SILVA": "ESCOLA MUNICIPAL DE 1 GRAU PROF AMAURI R DA SILVA",
  "ESCOLA MUNICIPAL ANTONIO MARTINS DA COSTA": "ESCOLA MUNICIPAL ANTONIO MARTINS DA COSTA",
  "ESCOLA MUNICIPAL DE 1º GRAU AMARO CAVALCANTE": "ESCOLA MUNICIPAL DE 1º GRAU AMARO CAVALCANTE",
  "ESCOLA MUNICIPAL DE 1º GRAU HIGINO ROBERTO": "ESCOLA MUNICIPAL DE 1º GRAU HIGINO ROBERTO",
  "ESCOLA MUNICIPAL DE 1º GRAU MANOEL COSME": "ESCOLA MUNICIPAL MANOEL COSME",
  "ESCOLA MUNICIPAL DE 1º GRAU MIGUEL MARQUES": "ESCOLA MUNICIPAL DE 1º GRAU MIGUEL MARQUES",
  "ESCOLA MUNICIPAL DE 1º GRAU PEDRO FERNANDES": "ESCOLA MUNICIPAL DE 1º GRAU PEDRO FERNANDES",
  "ESCOLA MUNICIPAL DE 1º GRAU PROFESSORA MARIA BARROS FEITOSA": "ESCOLA MUNICIPAL DE 1º GRAU PROFESSORA MARIA BARROS FEITOSA",
  "ESCOLA MUNICIPAL DE 1º GRAU RUI BARBOSA": "ESCOLA MUNICIPAL DE 1º GRAU RUI BARBOSA",
  "ESCOLA MUNICIPAL DE 1º PROFESORA MARIA LINDALVA": "ESCOLA MUNICIPAL PROFª MARIA LINDALVA",
  "ESCOLA MUNICIPAL PORFIRO GABRIEL DOS ANJOS": "ESCOLA MUNICIPAL PORFIRO GABRIEL DOS ANJOS",
  "ESCOLA MUNICIPAL VICENTE JOAO": "ESCOLA MUNICIPAL VICENTE JOAO",
};

/** Nível do "Leitor Fluente Rápido" -> nível do SME, progressão 1:1 (decisão confirmada com o usuário na ETAPA 10). */
const MAPA_NIVEL_LEITOR_FLUENTE: Record<string, string> = {
  pre_leitor_1: "NAO_LEITOR",
  pre_leitor_2: "LEITOR_DE_SILABAS",
  pre_leitor_3: "LEITOR_DE_PALAVRAS",
  pre_leitor_4: "LEITOR_DE_FRASES",
  leitor_iniciante: "LEITOR_SEM_FLUENCIA",
  leitor_fluente: "LEITOR_FLUENTE",
};

function relatarResultados(rotulo: string, linhas: ResultadoImportado[]) {
  const porStatus = { ok: 0, nao_encontrado: 0, ambiguo: 0, erro_dado: 0 } as Record<ResultadoImportado["status"], number>;
  for (const l of linhas) porStatus[l.status]++;
  console.log(`\n--- ${rotulo} ---`);
  console.log(`total: ${linhas.length} | ok: ${porStatus.ok} | não encontrado: ${porStatus.nao_encontrado} | ambíguo: ${porStatus.ambiguo} | erro de dado: ${porStatus.erro_dado}`);
  const problemas = linhas.filter((l) => l.status !== "ok");
  if (problemas.length > 0) {
    console.log(`primeiros ${Math.min(15, problemas.length)} com problema:`);
    for (const l of problemas.slice(0, 15)) {
      console.log(`  linha ${l.linha} [${l.status}] ${l.identificadorUsado} — ${l.detalhe}`);
    }
  }
}

interface GabaritoExport {
  grade: string;
  assessment_id: string;
  questions: { n: number; answer: string; subject: string }[];
}
interface ResultadoSpadebExport {
  grade: string;
  escola: string;
  turma_nome: string;
  turma_grade: string;
  aluno: string;
  answers: string[];
  percentage: number;
  classification: string | null;
}
interface LancamentoLeitorFluenteExport {
  avaliacao: string;
  escola: string;
  turma: string;
  aluno: string;
  participou: boolean;
  nivel: string | null;
  observacoes: string | null;
}

function codigoSpadebPorSerie(grade: string): string {
  // "2º Ano" -> "SPADEB-2026-2ANO"
  const numero = grade.match(/\d+/)?.[0] ?? grade.replace(/\W/g, "");
  return `SPADEB-2026-${numero}ANO`;
}

async function migrarSpadeb() {
  const gabaritos = lerJson<GabaritoExport[]>("spadeb_gabaritos.json");
  const resultados = lerJson<ResultadoSpadebExport[]>("spadeb_resultados.json");

  const resultadosPorGrade = new Map<string, ResultadoSpadebExport[]>();
  for (const r of resultados) {
    if (!resultadosPorGrade.has(r.grade)) resultadosPorGrade.set(r.grade, []);
    resultadosPorGrade.get(r.grade)!.push(r);
  }

  for (const gabarito of gabaritos) {
    const codigo = codigoSpadebPorSerie(gabarito.grade);
    console.log(`\n=== SPADEB ${gabarito.grade} (${codigo}) ===`);

    let avaliacao = await prisma.avaliacao.findUnique({ where: { codigo } });
    if (!avaliacao) {
      if (!COMMIT) {
        console.log("[dry-run] avaliação ainda não existe — seria criada.");
      } else {
        avaliacao = await prisma.avaliacao.create({
          data: {
            codigo,
            nome: `SPADEB 2026 — ${gabarito.grade}`,
            tipo: "SPADEB",
            ano: 2026,
            etapaEnsino: gabarito.grade,
            descricao: "Sistema Permanente de Avaliação da Educação Básica de Baraúna — importado de barauna-edu-hub.",
          },
        });
        console.log(`avaliação criada: ${avaliacao.id}`);
      }
    } else {
      console.log(`avaliação já existe: ${avaliacao.id}`);
    }

    // Questões (gabarito) — só faz sentido gravar se a avaliação existe (modo --commit).
    const linhasQuestao: LinhaTabular[] = gabarito.questions.map((q) => ({
      numero: String(q.n),
      gabarito: q.answer,
      descritor: q.subject,
    }));
    const questoesValidadas = validarLinhasQuestao(linhasQuestao);
    const comErro = questoesValidadas.filter((q) => q.erro);
    console.log(`questões no arquivo: ${questoesValidadas.length} (${comErro.length} com erro)`);

    if (COMMIT && avaliacao) {
      const resultadoCommit = await commitQuestoesImportadas(avaliacao.id, questoesValidadas);
      console.log(`questões criadas: ${resultadoCommit.criadas}; ignoradas por já existir: ${resultadoCommit.ignoradasPorDuplicidade.length}`);
    }

    // Resultados
    const resultadosDaSerie = resultadosPorGrade.get(gabarito.grade) ?? [];
    const linhasResultado: LinhaTabular[] = resultadosDaSerie.map((r) => {
      const escolaReal = MAPA_ESCOLA_SPADEB[r.escola];
      // `pontuacao` NÃO é preenchida a partir de `r.percentage`: 1983 dos 1998
      // resultados (99%) têm esse campo zerado na origem — não é uma nota
      // real de 0%, é um campo que o barauna-edu-hub nunca chegou a calcular
      // para a maioria dos registros (confirmado comparando com `answers`,
      // que tem variação real). Gravar isso como pontuação seria inventar um
      // dado — a % de acerto real já fica disponível pela aba Análise
      // (calculada a partir de `respostasJson` + gabarito, ETAPA 09).
      const linha: LinhaTabular = {
        nome: r.aluno,
        escola: escolaReal ?? r.escola, // sem mapeamento -> passa o nome original, vira "não encontrado" (nunca inventa escola)
        observacoes: r.classification ? `Classificação SPADEB: ${r.classification}` : "",
      };
      r.answers.forEach((resposta, indice) => {
        if (resposta) linha[`resposta_${indice + 1}`] = resposta;
      });
      return linha;
    });

    const resultadosValidados = await validarLinhasResultado(linhasResultado);
    relatarResultados(`SPADEB ${gabarito.grade} — resultados`, resultadosValidados);

    if (COMMIT && avaliacao) {
      const gravados = await commitResultadosImportados(avaliacao.id, resultadosValidados);
      console.log(`resultados gravados: ${gravados}`);
    }
  }
}

async function migrarLeitorFluente() {
  const lancamentos = lerJson<LancamentoLeitorFluenteExport[]>("leitor_fluente_lancamentos.json");
  const codigo = "LEITOR-FLUENTE-PARC-2026";

  console.log(`\n=== Leitor Fluente Rápido — Avaliação Diagnóstica PARC (${codigo}) ===`);

  let avaliacao = await prisma.avaliacao.findUnique({ where: { codigo } });
  if (!avaliacao) {
    if (!COMMIT) {
      console.log("[dry-run] avaliação ainda não existe — seria criada.");
    } else {
      avaliacao = await prisma.avaliacao.create({
        data: {
          codigo,
          nome: "Avaliação Diagnóstica de Fluência Leitora — PARC",
          tipo: "FLUENCIA_LEITORA",
          ano: 2026,
          etapaEnsino: "2º Ano",
          descricao: "Importado do sistema Leitor Fluente Rápido.",
        },
      });
      console.log(`avaliação criada: ${avaliacao.id}`);
    }
  } else {
    console.log(`avaliação já existe: ${avaliacao.id}`);
  }

  const linhasResultado: LinhaTabular[] = lancamentos
    .filter((l) => l.participou) // quem não participou não tem nível — nada a lançar como resultado
    .map((l) => {
      const escolaReal = MAPA_ESCOLA_LEITOR_FLUENTE[l.escola];
      const nivelMapeado = l.nivel ? MAPA_NIVEL_LEITOR_FLUENTE[l.nivel] : undefined;
      return {
        nome: l.aluno,
        escola: escolaReal ?? l.escola,
        nivel: nivelMapeado ?? "",
        observacoes: l.observacoes ?? "",
      };
    });

  // Confere que todo nível de origem tem mapeamento antes de seguir — se não tiver, é um bug do mapa, não do dado.
  const semNivelMapeado = linhasResultado.filter((l) => !l.nivel);
  if (semNivelMapeado.length > 0) {
    console.log(`AVISO: ${semNivelMapeado.length} linha(s) sem nível mapeado (verificar MAPA_NIVEL_LEITOR_FLUENTE).`);
  }

  const resultadosValidados = await validarLinhasResultado(linhasResultado);
  const naoParticiparam = lancamentos.filter((l) => !l.participou).length;
  console.log(`lançamentos no arquivo: ${lancamentos.length} (${naoParticiparam} sem participação, não entram no resultado)`);
  relatarResultados("Leitor Fluente Rápido — resultados", resultadosValidados);

  if (COMMIT && avaliacao) {
    const gravados = await commitResultadosImportados(avaliacao.id, resultadosValidados);
    console.log(`resultados gravados: ${gravados}`);
  }
}

async function main() {
  console.log(COMMIT ? "MODO: COMMIT (vai gravar na base real)" : "MODO: DRY-RUN (não grava nada)");
  await migrarSpadeb();
  await migrarLeitorFluente();
  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  await prisma.$disconnect();
  process.exit(1);
});
