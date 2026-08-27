import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import {
  validarLinhasResultadoTurma,
  commitResultadosTurmaImportados,
  type FiltroCaed,
} from "../lib/import/caed-turma-import";
import { CAED_ANOS_ESCOLARES, CAED_COMPONENTES, CAED_TURMA_SENTINELA_ESCOLA } from "../lib/caed-catalogo";
import type { LinhaTabular } from "../lib/import/parse-tabular";

/**
 * Importa a varredura em nível de ESCOLA feita manualmente lendo a tela do
 * CAEd (não há CSV nesse nível — só por turma). Cada escola vira uma linha
 * com turma = `CAED_TURMA_SENTINELA_ESCOLA`, marcando que não é
 * detalhamento por turma real, só agregado da rede.
 *
 * Entrada: um .jsonl onde cada linha é
 * { ciclo, ano, anoEscolar, componente, rede, pagina,
 *   linhas: [[escolaTexto, previstos, avaliados, participacao%, defasagem%, intermediario%, adequado%], ...] }
 */

const ARQUIVO = process.argv[2];
if (!ARQUIVO) {
  console.error("Uso: tsx scripts/importar-caed-escola.ts <arquivo.jsonl>");
  process.exit(1);
}

interface LinhaBruta {
  ciclo: "AV1" | "AV2";
  ano: number;
  anoEscolar: string;
  componente: string;
  rede: string;
  pagina: number;
  linhas: [string, string, string, string, string, string, string][];
}

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

  const grupos = new Map<string, LinhaBruta[]>();
  for (const b of brutas) {
    const chave = `${b.ciclo}|${b.ano}|${b.anoEscolar}|${b.componente}|${b.rede}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(b);
  }

  let totalGravados = 0;
  let totalErros = 0;

  for (const [chave, paginas] of grupos) {
    const primeira = paginas[0]!;
    const componente = componenteInfo(primeira.componente);
    const filtro: FiltroCaed = {
      codigoCiclo: primeira.ciclo,
      nomeCiclo: primeira.ciclo === "AV1" ? "Ciclo I" : "Ciclo II",
      ano: primeira.ano,
      anoEscolarValor: anoEscolarTexto(primeira.anoEscolar),
      componenteSlug: componente.slug,
      componenteLabel: componente.label,
      redeValor: primeira.rede,
    };

    const linhasTabulares: LinhaTabular[] = paginas.flatMap((p) =>
      p.linhas.map(([escola, , avaliados, participacao, defasagem, intermediario, adequado]) => ({
        escola,
        turma: CAED_TURMA_SENTINELA_ESCOLA,
        ano_escolar: filtro.anoEscolarValor,
        rede: filtro.redeValor,
        "avaliados_(%)": participacao.replace("%", ""),
        defasagem,
        aprendizado_intermediario: intermediario,
        aprendizado_adequado: adequado,
      })),
    );

    const validadas = await validarLinhasResultadoTurma(linhasTabulares, filtro);
    const gravados = await commitResultadosTurmaImportados(filtro, validadas);
    const erros = validadas.filter((l) => l.status !== "ok");

    totalGravados += gravados;
    totalErros += erros.length;

    console.log(`${chave}: ${gravados} gravados, ${erros.length} com problema`);
    for (const e of erros) {
      console.log(`  - [${e.status}] ${e.escolaTexto}: ${e.detalhe}`);
    }
  }

  console.log(`\nTotal: ${totalGravados} registros gravados, ${totalErros} linhas com problema, ${grupos.size} combinações.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
