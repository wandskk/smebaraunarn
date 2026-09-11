import { prisma } from "@/lib/prisma";
import { ordemCicloCaed, type ResumoResultadosTurma } from "@/lib/analytics/avaliacoes";
import { ANOS_FINAIS_ANOS_ESCOLARES, ANOS_FINAIS_CICLOS, ANOS_FINAIS_COMPONENTES } from "@/lib/anos-finais-catalogo";
import { getResumoResultadosTurma, extrairCicloEComponenteDoCodigo } from "./avaliacoes";

/**
 * Consultas do painel "Anos Finais" — espelham `getCaedFiltrosDisponiveis`/
 * `getCaedResumoPorCiclo` (mesma forma de extrair ciclo/componente do
 * `codigo` da `Avaliacao`, mesmo agregador `getResumoResultadosTurma`), só
 * que filtradas por `tipo: AVALIACAO_CONTINUA_ANOS_FINAIS` e usando o
 * catálogo de Anos Finais — arquivo à parte, não uma opção a mais nas
 * consultas do CAEd, pela mesma decisão de manter as duas fontes separadas
 * (ver `lib/import/anos-finais-turma-import.ts`).
 */

export interface AnosFinaisOpcaoAvaliacao {
  codigoCiclo: string;
  nomeCiclo: string;
  ano: number;
  label: string;
}

export interface AnosFinaisFiltroOpcoes {
  avaliacoes: AnosFinaisOpcaoAvaliacao[];
  etapas: { valor: string; label: string }[];
  componentes: { slug: string; label: string }[];
}

/** Só as combinações que realmente têm `Avaliacao` de Anos Finais importada (mesmo racional de `getCaedFiltrosDisponiveis`). */
export async function getAnosFinaisFiltrosDisponiveis(): Promise<AnosFinaisFiltroOpcoes> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { tipo: "AVALIACAO_CONTINUA_ANOS_FINAIS" },
    select: { codigo: true, ano: true, etapaEnsino: true },
  });

  const avaliacoesVistas = new Map<string, AnosFinaisOpcaoAvaliacao>();
  const etapasVistas = new Set<string>();
  const componentesVistos = new Set<string>();

  for (const a of avaliacoes) {
    const { codigoCiclo, componenteSlug } = extrairCicloEComponenteDoCodigo(a.codigo, a.ano);
    const nomeCiclo = ANOS_FINAIS_CICLOS.find((c) => c.codigoCiclo === codigoCiclo)?.nomeCiclo ?? codigoCiclo;
    avaliacoesVistas.set(`${codigoCiclo}${a.ano}`, { codigoCiclo, nomeCiclo, ano: a.ano, label: `${nomeCiclo} / ${a.ano}` });
    if (a.etapaEnsino) etapasVistas.add(a.etapaEnsino);
    if (componenteSlug) componentesVistos.add(componenteSlug);
  }

  return {
    avaliacoes: Array.from(avaliacoesVistas.values()).sort((a, b) => b.ano - a.ano || ordemCicloCaed(b.codigoCiclo) - ordemCicloCaed(a.codigoCiclo)),
    etapas: ANOS_FINAIS_ANOS_ESCOLARES.filter((e) => etapasVistas.has(e.valor)).map((e) => ({ valor: e.valor, label: e.label })),
    componentes: ANOS_FINAIS_COMPONENTES.filter((c) => componentesVistos.has(c.slug)).map((c) => ({ slug: c.slug, label: c.label })),
  };
}

export interface AnosFinaisResumoCiclo {
  avaliacaoId: string;
  ano: number;
  codigoCiclo: string;
  nomeCiclo: string;
  resumo: ResumoResultadosTurma;
}

/** Todos os ciclos (de todos os anos) já importados para uma combinação etapa+componente (mesmo racional de `getCaedResumoPorCiclo`). */
export async function getAnosFinaisResumoPorCiclo(params: { etapaEnsino: string; componenteSlug: string }): Promise<AnosFinaisResumoCiclo[]> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: {
      tipo: "AVALIACAO_CONTINUA_ANOS_FINAIS",
      etapaEnsino: params.etapaEnsino,
      codigo: { endsWith: `-${params.componenteSlug}` },
    },
    select: { id: true, codigo: true, ano: true },
  });

  const resultados = await Promise.all(
    avaliacoes.map(async (a): Promise<AnosFinaisResumoCiclo | null> => {
      const resumo = await getResumoResultadosTurma(a.id);
      if (!resumo) return null;
      const { codigoCiclo } = extrairCicloEComponenteDoCodigo(a.codigo, a.ano);
      const nomeCiclo = ANOS_FINAIS_CICLOS.find((c) => c.codigoCiclo === codigoCiclo)?.nomeCiclo ?? codigoCiclo;
      return { avaliacaoId: a.id, ano: a.ano, codigoCiclo, nomeCiclo, resumo };
    }),
  );

  return resultados
    .filter((r): r is AnosFinaisResumoCiclo => r !== null)
    .sort((a, b) => a.ano - b.ano || ordemCicloCaed(a.codigoCiclo) - ordemCicloCaed(b.codigoCiclo));
}
