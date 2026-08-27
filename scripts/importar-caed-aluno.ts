import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { validarLinhasResultado, commitResultadosImportados } from "../lib/import/avaliacoes-import";
import { CAED_ANOS_ESCOLARES, CAED_COMPONENTES } from "../lib/caed-catalogo";
import type { LinhaTabular } from "../lib/import/parse-tabular";

/**
 * Importa o mergulho manual até o nível de aluno (escola → turma → aluno)
 * feito lendo a tela do CAEd para as combinações prioritárias — não existe
 * CSV nesse nível, só a tabela em tela, sem matrícula/CPF. Por isso o
 * casamento com nosso Estudante é só por nome + escola (mesma função
 * `resolverEstudante` já usada no importador de resultados por aluno das
 * Avaliações Municipais), com linhas ambíguas/não encontradas sinalizadas
 * em vez de gravadas incorretamente.
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

  // cache de código INEP -> nome canônico da nossa Escola
  const cacheEscola = new Map<string, string | null>();

  async function nomeCanonico(escolaCaed: string): Promise<string | null> {
    if (cacheEscola.has(escolaCaed)) return cacheEscola.get(escolaCaed)!;
    const match = escolaCaed.match(REGEX_CODIGO_INEP);
    if (!match) {
      cacheEscola.set(escolaCaed, null);
      return null;
    }
    const escola = await prisma.escola.findFirst({ where: { codigoInep: match[1]! }, select: { nome: true } });
    cacheEscola.set(escolaCaed, escola?.nome ?? null);
    return escola?.nome ?? null;
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
    for (const bloco of blocos) {
      const nomeEscola = await nomeCanonico(bloco.escola);
      for (const [nome, participacao, nivel] of bloco.alunos) {
        linhasTabulares.push({
          nome,
          escola: nomeEscola ?? "",
          observacoes: `Turma CAEd: ${bloco.turma} · Participação: ${participacao} · Nível: ${nivel}`,
        });
      }
    }

    const validadas = await validarLinhasResultado(linhasTabulares);
    const gravados = await commitResultadosImportados(avaliacao.id, validadas);
    const problemas = validadas.filter((l) => l.status !== "ok");

    totalGravados += gravados;
    totalProblema += problemas.length;

    console.log(`${chave}: ${gravados} gravados, ${problemas.length} com problema`);
    for (const p of problemas) {
      console.log(`  - [${p.status}] ${p.identificadorUsado}: ${p.detalhe}`);
    }
  }

  console.log(`\nTotal: ${totalGravados} resultados de aluno gravados, ${totalProblema} linhas com problema.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
