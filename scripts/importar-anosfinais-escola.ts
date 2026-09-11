import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { validarLinhasResultadoTurmaAnosFinais, commitResultadosTurmaImportadosAnosFinais, type FiltroAnosFinais } from "../lib/import/anos-finais-turma-import";
import { ANOS_FINAIS_ANOS_ESCOLARES, ANOS_FINAIS_CICLOS, ANOS_FINAIS_COMPONENTES, ANOS_FINAIS_TURMA_SENTINELA_ESCOLA } from "../lib/anos-finais-catalogo";
import type { LinhaTabular } from "../lib/import/parse-tabular";

/**
 * Importa o agregado por ESCOLA extraído da API do portal Avaliação e
 * Acompanhamento das Aprendizagens nos Anos Finais (ver
 * `scripts/extrair-anosfinais-escolas.ts` + `scripts/mapear-anosfinais-escolas.ts`).
 *
 * Espelha `scripts/importar-caed-escola.ts`, mas grava contra
 * `Avaliacao.tipo = AVALIACAO_CONTINUA_ANOS_FINAIS` com código prefixado
 * `ANOSFINAIS-` (nunca `CAED-`) — mantém os dois pipelines separados mesmo
 * dentro da mesma tabela `AvaliacaoResultadoTurma`.
 *
 * Entrada: um .jsonl onde cada linha é um `RegistroEscolaBruto` (ver
 * `scripts/mapear-anosfinais-escolas.ts`), um objeto por escola por
 * combinação de ciclo/ano escolar/componente.
 */

const ARQUIVO = process.argv[2];
if (!ARQUIVO) {
  console.error("Uso: tsx scripts/importar-anosfinais-escola.ts <arquivo.jsonl>");
  process.exit(1);
}

interface RegistroEscolaBruto {
  ciclo: "AV1" | "AV2" | "AV3";
  ano: number;
  anoEscolar: string;
  componente: string;
  escolaCodigo: string;
  escolaNome: string | null;
  previstos: number | null;
  avaliados: number | null;
  percentualParticipacao: number | null;
  percentualDefasagem: number | null;
  percentualIntermediario: number | null;
  percentualAdequado: number | null;
  quantidadeDefasagem: number | null;
  quantidadeIntermediario: number | null;
  quantidadeAdequado: number | null;
  acertoPorHabilidade: Record<string, number> | null;
}

function anoEscolarTexto(codigo: string): string {
  const numero = codigo.replace("ANO", "");
  const item = ANOS_FINAIS_ANOS_ESCOLARES.find((a) => a.valor.endsWith(`${numero}º ANO`));
  if (!item) throw new Error(`Ano escolar desconhecido: ${codigo}`);
  return item.valor;
}

function componenteInfo(slug: string) {
  const item = ANOS_FINAIS_COMPONENTES.find((c) => c.slug === slug);
  if (!item) throw new Error(`Componente desconhecido: ${slug}`);
  return item;
}

/** `RegistroEscolaBruto` → `LinhaTabular` no mesmo formato tabular usado pelo importador do CAEd (mesmo parser, arquivo à parte por decisão de separação). */
function paraLinhaTabular(r: RegistroEscolaBruto, anoEscolarValor: string): LinhaTabular {
  const nomeBase = r.escolaNome ?? "ESCOLA";
  const escola = nomeBase.trim().endsWith(r.escolaCodigo) ? nomeBase : `${nomeBase} - ${r.escolaCodigo}`;
  const linha: LinhaTabular = {
    escola,
    turma: ANOS_FINAIS_TURMA_SENTINELA_ESCOLA,
    ano_escolar: anoEscolarValor,
    rede: "PUBLICA",
    previstos: r.previstos !== null ? String(r.previstos) : "",
    avaliados: r.avaliados !== null ? String(r.avaliados) : "",
    "avaliados_(%)": r.percentualParticipacao !== null ? String(r.percentualParticipacao) : "",
    defasagem: r.percentualDefasagem !== null ? String(r.percentualDefasagem) : "",
    aprendizado_intermediario: r.percentualIntermediario !== null ? String(r.percentualIntermediario) : "",
    aprendizado_adequado: r.percentualAdequado !== null ? String(r.percentualAdequado) : "",
    quantidade_defasagem: r.quantidadeDefasagem !== null ? String(r.quantidadeDefasagem) : "",
    quantidade_intermediario: r.quantidadeIntermediario !== null ? String(r.quantidadeIntermediario) : "",
    quantidade_adequado: r.quantidadeAdequado !== null ? String(r.quantidadeAdequado) : "",
  };
  for (const [habilidade, percentual] of Object.entries(r.acertoPorHabilidade ?? {})) {
    const numero = habilidade.replace(/^H/i, "");
    linha[`h_${numero.padStart(2, "0")}_(%)`] = String(percentual);
  }
  return linha;
}

async function main() {
  const texto = readFileSync(ARQUIVO!, "utf-8").trim();
  const brutos: RegistroEscolaBruto[] = texto
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const grupos = new Map<string, RegistroEscolaBruto[]>();
  for (const r of brutos) {
    const chave = `${r.ciclo}|${r.ano}|${r.anoEscolar}|${r.componente}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(r);
  }

  let totalGravados = 0;
  let totalErros = 0;

  for (const [chave, registros] of grupos) {
    const primeiro = registros[0]!;
    const componente = componenteInfo(primeiro.componente);
    const anoEscolarValor = anoEscolarTexto(primeiro.anoEscolar);
    const nomeCiclo = ANOS_FINAIS_CICLOS.find((c) => c.codigoCiclo === primeiro.ciclo)?.nomeCiclo;
    if (!nomeCiclo) throw new Error(`Ciclo desconhecido: ${primeiro.ciclo}`);
    const filtro: FiltroAnosFinais = {
      codigoCiclo: primeiro.ciclo,
      nomeCiclo,
      ano: primeiro.ano,
      anoEscolarValor,
      componenteSlug: componente.slug,
      componenteLabel: componente.label,
      redeValor: "PUBLICA",
    };

    const linhasTabulares = registros.map((r) => paraLinhaTabular(r, anoEscolarValor));

    const validadas = await validarLinhasResultadoTurmaAnosFinais(linhasTabulares, filtro);
    const gravados = await commitResultadosTurmaImportadosAnosFinais(filtro, validadas);
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
