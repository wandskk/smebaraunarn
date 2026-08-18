import Link from "next/link";
import { ArrowLeft, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getFrequenciaPorEscola, calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import type { VariacaoFrequencia } from "@/lib/analytics/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";

interface PageProps {
  searchParams: { ano?: string };
}

function TendenciaCell({ variacao }: { variacao: VariacaoFrequencia | null }) {
  if (!variacao) return <span className="text-xs text-slate-400">sem dado no período anterior</span>;

  const { diferencaPontosPercentuais, tendencia } = variacao;
  const texto = `${diferencaPontosPercentuais > 0 ? "+" : ""}${diferencaPontosPercentuais.toFixed(1)} p.p.`;

  if (tendencia === "alta") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <TrendingUp className="h-3.5 w-3.5" /> {texto}
      </span>
    );
  }
  if (tendencia === "queda") {
    return (
      <span className="inline-flex items-center gap-1 text-red-700">
        <TrendingDown className="h-3.5 w-3.5" /> {texto}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Minus className="h-3.5 w-3.5" /> {texto}
    </span>
  );
}

export default async function FrequenciaPorEscolaPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const escolas = await getFrequenciaPorEscola({ anoLetivo, ...janela });
  const semHistoricoParaTendencia = escolas.length > 0 && escolas.every((e) => e.variacao === null);

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Frequência por Escola</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Onde a frequência está piorando? Compara {janela.atualInicio} a {janela.atualFim} com os 30 dias
        anteriores a esse período ({janela.anteriorInicio} a {janela.anteriorFim}). Ano letivo {anoLetivo}. Lista
        ordenada da frequência mais baixa para a mais alta.
      </p>

      {semHistoricoParaTendencia && (
        <p className="mt-3 max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Nenhuma escola tem tendência calculada ainda: a sincronização de frequência começou há poucos dias, sem
          histórico suficiente para o período de comparação. A tendência aparece automaticamente assim que houver
          dados no período anterior.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3">Estudantes</th>
              <th className="px-4 py-3">Frequência atual</th>
              <th className="px-4 py-3">Tendência</th>
              <th className="px-4 py-3">Faixa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {escolas.map((escola) => (
              <tr key={escola.escolaId}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/escolas/${escola.escolaId}`}
                    className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                  >
                    {escola.nomeEscola}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(escola.totalEstudantes)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {escola.percentualAtual === null ? "-" : `${escola.percentualAtual.toFixed(1)}%`}
                </td>
                <td className="px-4 py-3">
                  <TendenciaCell variacao={escola.variacao} />
                </td>
                <td className="px-4 py-3">
                  <FaixaBadge faixa={escola.faixa} />
                </td>
              </tr>
            ))}
            {escolas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma escola com frequência registrada neste ano letivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
