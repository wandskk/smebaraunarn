import Link from "next/link";
import { ArrowLeft, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";

interface PageProps {
  searchParams: { ano?: string };
}

function formatarPercentual(valor: number | null): string {
  return valor === null ? "-" : `${valor.toFixed(1)}%`;
}

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

/**
 * `maiorEhMelhor` inverte a leitura de cor: frequência e desempenho, acima
 * da rede é bom; distorção idade-série, acima da rede é ruim (tem mais
 * estudantes defasados que a média, não menos).
 */
function DiferencaRede({
  diferenca,
  unidade,
  maiorEhMelhor,
}: {
  diferenca: number | null;
  unidade: "p.p." | "pts";
  maiorEhMelhor: boolean;
}) {
  if (diferenca === null) return <span className="text-xs text-slate-400">sem referência de rede</span>;

  const estavel = Math.abs(diferenca) < 0.05;
  const favoravel = estavel ? null : maiorEhMelhor ? diferenca > 0 : diferenca < 0;
  const texto = `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)} ${unidade}`;

  if (estavel) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Minus className="h-3.5 w-3.5" /> {texto} da rede
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${favoravel ? "text-emerald-700" : "text-red-700"}`}>
      {diferenca > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {texto} da rede
    </span>
  );
}

export default async function ComparativosPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const { escolas, rede } = await getComparativosPorEscola({ anoLetivo, ...janela });

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Comparativos — Escola × Rede</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Cada escola comparada com a referência de rede no mesmo recorte, em vez do número isolado. A referência de
        rede é uma média ponderada pelo tamanho de cada escola no indicador (aulas dadas, notas lançadas ou
        estudantes elegíveis) — não a média simples das escolas, que daria peso igual a uma escola pequena e a uma
        grande. Frequência: {janela.atualInicio} a {janela.atualFim}. Ano letivo {anoLetivo}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Frequência da rede</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{formatarPercentual(rede.frequenciaPercentual)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Desempenho médio da rede</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{formatarNota(rede.desempenhoMedia)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Distorção idade-série da rede</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{formatarPercentual(rede.distorcaoPercentual)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3">Frequência</th>
              <th className="px-4 py-3">Faixa</th>
              <th className="px-4 py-3">Desempenho</th>
              <th className="px-4 py-3">Distorção idade-série</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {escolas.map((escola) => (
              <tr key={escola.escolaId ?? escola.nomeEscola}>
                <td className="px-4 py-3">
                  {escola.escolaId !== null ? (
                    <Link
                      href={`/admin/escolas/${escola.escolaId}`}
                      className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {escola.nomeEscola}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900">{escola.nomeEscola}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{formatarPercentual(escola.frequenciaPercentual)}</div>
                  <DiferencaRede diferenca={escola.frequenciaDiferencaRede} unidade="p.p." maiorEhMelhor />
                </td>
                <td className="px-4 py-3">
                  <FaixaBadge faixa={escola.frequenciaFaixa} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{formatarNota(escola.desempenhoMedia)}</div>
                  <DiferencaRede diferenca={escola.desempenhoDiferencaRede} unidade="pts" maiorEhMelhor />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{formatarPercentual(escola.distorcaoPercentual)}</div>
                  <DiferencaRede
                    diferenca={escola.distorcaoDiferencaRede}
                    unidade="p.p."
                    maiorEhMelhor={false}
                  />
                </td>
              </tr>
            ))}
            {escolas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma escola com dado neste ano letivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {formatNumber(escolas.length)} escola(s) com pelo menos um indicador calculado. Uma célula vazia
        (&quot;sem referência de rede&quot;) acontece quando a escola não tem dado suficiente para esse indicador
        específico (ex.: creche sem estudante elegível para distorção idade-série).
      </p>
    </div>
  );
}
