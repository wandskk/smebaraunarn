import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { validarLinhasResultadoTurma, commitResultadosTurmaImportados, type FiltroCaed } from "../lib/import/caed-turma-import";
import { CAED_ANOS_ESCOLARES, CAED_CICLOS, CAED_COMPONENTES, CAED_TURMA_SENTINELA_ESCOLA } from "../lib/caed-catalogo";
import type { LinhaTabular } from "../lib/import/parse-tabular";

/**
 * Importa o agregado por ESCOLA extraído diretamente da API do portal
 * Criança Alfabetizada (ver `scripts/extrair-caed-escolas.ts`) — não há CSV
 * nesse nível, só a API/tela. Cada escola vira uma linha com
 * turma = `CAED_TURMA_SENTINELA_ESCOLA`, marcando que não é detalhamento por
 * turma real, só agregado da escola inteira.
 *
 * Reaproveita `validarLinhasResultadoTurma`/`commitResultadosTurmaImportados`
 * (mesmas usadas pelo upload manual de CSV em `app/admin/avaliacoes/caed/importar`)
 * — o extrator já entrega os campos com o nome que essas funções esperam,
 * então não há parsing posicional aqui (a versão anterior deste script tinha
 * um bug assim: `previstos`/`avaliados` eram descartados por causa de uma
 * desestruturação por posição de tupla).
 *
 * Entrada: um .jsonl onde cada linha é um `RegistroEscolaBruto` (ver
 * `scripts/extrair-caed-escolas.ts`), um objeto por escola por combinação de
 * ciclo/ano escolar/componente.
 */

const ARQUIVO = process.argv[2];
if (!ARQUIVO) {
  console.error("Uso: tsx scripts/importar-caed-escola.ts <arquivo.jsonl>");
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
  const item = CAED_ANOS_ESCOLARES.find((a) => a.valor.endsWith(`${numero}º ANO`));
  if (!item) throw new Error(`Ano escolar desconhecido: ${codigo}`);
  return item.valor;
}

function componenteInfo(slug: string) {
  const item = CAED_COMPONENTES.find((c) => c.slug === slug);
  if (!item) throw new Error(`Componente desconhecido: ${slug}`);
  return item;
}

/** `RegistroEscolaBruto` → `LinhaTabular` no mesmo formato que um CSV do CAEd produziria — reaproveita o parser existente sem duplicar a lógica de validação/upsert. */
function paraLinhaTabular(r: RegistroEscolaBruto, anoEscolarValor: string): LinhaTabular {
  // NM_ENTIDADE da API já vem como "NOME DA ESCOLA - <código>" — só completa se, por algum motivo, faltar.
  const nomeBase = r.escolaNome ?? "ESCOLA";
  const escola = nomeBase.trim().endsWith(r.escolaCodigo) ? nomeBase : `${nomeBase} - ${r.escolaCodigo}`;
  const linha: LinhaTabular = {
    escola,
    turma: CAED_TURMA_SENTINELA_ESCOLA,
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
    const nomeCiclo = CAED_CICLOS.find((c) => c.codigoCiclo === primeiro.ciclo)?.nomeCiclo;
    if (!nomeCiclo) throw new Error(`Ciclo desconhecido: ${primeiro.ciclo}`);
    const filtro: FiltroCaed = {
      codigoCiclo: primeiro.ciclo,
      nomeCiclo,
      ano: primeiro.ano,
      anoEscolarValor,
      componenteSlug: componente.slug,
      componenteLabel: componente.label,
      redeValor: "PUBLICA",
    };

    const linhasTabulares = registros.map((r) => paraLinhaTabular(r, anoEscolarValor));

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
