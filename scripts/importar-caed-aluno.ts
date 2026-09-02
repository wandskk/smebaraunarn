import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { validarLinhasResultado, commitResultadosImportados, commitResultadosNaoVinculados, type ResultadoNaoVinculado } from "../lib/import/avaliacoes-import";
import { CAED_ANOS_ESCOLARES, CAED_COMPONENTES } from "../lib/caed-catalogo";
import type { LinhaTabular } from "../lib/import/parse-tabular";

/**
 * Importa o mergulho manual até o nível de aluno (escola → turma → aluno)
 * feito lendo a tela do CAEd para as combinações prioritárias — não existe
 * CSV nesse nível, só a tabela em tela, sem matrícula/CPF. Por isso o
 * casamento com nosso Estudante é só por nome + escola (mesma função
 * `resolverEstudante` já usada no importador de resultados por aluno das
 * Avaliações Municipais). Linhas ambíguas (nome bate com mais de um
 * Estudante da mesma escola) ficam de fora — arriscado demais escolher uma.
 * Linhas "não encontrado" (nome não bate com nenhum Estudante da escola)
 * são gravadas mesmo assim, sem vínculo (`commitResultadosNaoVinculados`) —
 * pra não perder a estatística que a fonte original (CAEd) já tem só
 * porque o nosso cadastro de estudantes não confirma quem é.
 *
 * A turma do CAEd não é usada como filtro de casamento (o texto livre não
 * bate com Estudante.turmaSerie do SIGEduc) — só fica registrada em
 * `observacoes` para referência.
 *
 * Entrada: um .jsonl onde cada linha é
 * { ciclo, anoEscolar, componente, escola, turma, pagina,
 *   alunos: [[nome, participacao, nivel], ...] }
 */

const ARQUIVO = process.argv[2];
if (!ARQUIVO) {
  console.error("Uso: tsx scripts/importar-caed-aluno.ts <arquivo.jsonl>");
  process.exit(1);
}

interface LinhaBruta {
  ciclo: "AV1" | "AV2";
  anoEscolar: string;
  componente: string;
  escola: string;
  turma: string;
  pagina: number;
  alunos: [string, string, string][];
}

const REGEX_CODIGO_INEP = /-\s*(\d{6,8})\s*$/;

function anoEscolarTexto(codigo: string): string {
  const numero = codigo.replace("ANO", "");
  const item = CAED_ANOS_ESCOLARES.find((a) => a.valor.endsWith(`${numero}º ANO`));
  if (!item) throw new Error(`Ano escolar desconhecido: ${codigo}`);
  return item.valor;
}

function componenteInfo(slug: string) {
  const item = CAED_COMPONENTES.find((c) => c.slug === slug);
  if (!item) throw new Error(`Componente desconhecido: ${slug}`);
  return item;
}

async function main() {
  const texto = readFileSync(ARQUIVO!, "utf-8").trim();
  const brutas: LinhaBruta[] = texto
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  // cache de código INEP -> id + nome canônico da nossa Escola
  const cacheEscola = new Map<string, { id: number; nome: string } | null>();

  async function escolaCanonica(escolaCaed: string): Promise<{ id: number; nome: string } | null> {
    if (cacheEscola.has(escolaCaed)) return cacheEscola.get(escolaCaed)!;
    const match = escolaCaed.match(REGEX_CODIGO_INEP);
    if (!match) {
      cacheEscola.set(escolaCaed, null);
      return null;
    }
    const escola = await prisma.escola.findFirst({ where: { codigoInep: match[1]! }, select: { id: true, nome: true } });
    const resultado = escola ? { id: escola.id, nome: escola.nome } : null;
    cacheEscola.set(escolaCaed, resultado);
    return resultado;
  }

  // agrupa por (ciclo, anoEscolar, componente) — mesma Avaliacao já criada na importação de turma
  const grupos = new Map<string, LinhaBruta[]>();
  for (const b of brutas) {
    const chave = `${b.ciclo}|${b.anoEscolar}|${b.componente}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(b);
  }

  let totalGravados = 0;
  let totalProblema = 0;

  for (const [chave, blocos] of grupos) {
    const primeira = blocos[0]!;
    const componente = componenteInfo(primeira.componente);
    const codigo = `CAED-${primeira.ciclo}2026-${anoEscolarTexto(primeira.anoEscolar)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")}-${componente.slug}`;

    const avaliacao = await prisma.avaliacao.findUnique({ where: { codigo } });
    if (!avaliacao) {
      console.log(`${chave}: Avaliacao "${codigo}" não encontrada (rode antes o import de turma) — pulando.`);
      continue;
    }

    const linhasTabulares: LinhaTabular[] = [];
    const escolaIdPorLinha: (number | null)[] = [];
    for (const bloco of blocos) {
      const escolaInfo = await escolaCanonica(bloco.escola);
      for (const [nome, participacao, nivel] of bloco.alunos) {
        linhasTabulares.push({
          nome,
          escola: escolaInfo?.nome ?? "",
          observacoes: `Turma CAEd: ${bloco.turma} · Participação: ${participacao} · Nível: ${nivel}`,
        });
        escolaIdPorLinha.push(escolaInfo?.id ?? null);
      }
    }

    const validadas = await validarLinhasResultado(linhasTabulares);
    const gravados = await commitResultadosImportados(avaliacao.id, validadas);

    const naoEncontrados: ResultadoNaoVinculado[] = [];
    validadas.forEach((l, indice) => {
      if (l.status !== "nao_encontrado") return;
      const escolaId = escolaIdPorLinha[indice];
      const nomeBruto = linhasTabulares[indice]!.nome;
      if (escolaId && nomeBruto) naoEncontrados.push({ escolaId, nomeBruto });
    });
    const gravadosSemVinculo = await commitResultadosNaoVinculados(avaliacao.id, naoEncontrados);

    const problemas = validadas.filter((l) => l.status !== "ok");
    const problemasRestantes = problemas.filter((l) => l.status !== "nao_encontrado");

    totalGravados += gravados + gravadosSemVinculo;
    totalProblema += problemasRestantes.length;

    console.log(
      `${chave}: ${gravados} gravados, ${gravadosSemVinculo} sem vínculo (nome não encontrado, gravados mesmo assim), ${problemasRestantes.length} com problema`,
    );
    for (const p of problemasRestantes) {
      console.log(`  - [${p.status}] ${p.identificadorUsado}: ${p.detalhe}`);
    }
  }

  console.log(`\nTotal: ${totalGravados} resultados de aluno gravados (com ou sem vínculo), ${totalProblema} linhas com problema.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
