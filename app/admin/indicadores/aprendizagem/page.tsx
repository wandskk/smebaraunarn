import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDesempenhoPorEscola, NOTA_MINIMA_ESPERADA_PADRAO } from "@/lib/queries/desempenho";

interface PageProps {
  searchParams: { ano?: string };
}

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

export default async function AprendizagemPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const escolas = await getDesempenhoPorEscola({ anoLetivo });

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Aprendizagem por Escola</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Duas escolas com a mesma média podem ter realidades bem diferentes — por isso a distribuição importa
        mais que a média isolada. Mediana e percentis (P25/P75) mostram a nota típica e a dispersão; a proporção
        abaixo de {NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)} usa o critério provisório de aprovação (ainda não
        confirmado pela Secretaria — ver docs/PLANO_DESENVOLVIMENTO.md). Ano letivo {anoLetivo}. Lista ordenada
        da média mais baixa para a mais alta.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3">Notas lançadas</th>
              <th className="px-4 py-3">Média</th>
              <th className="px-4 py-3">Mediana</th>
              <th className="px-4 py-3">P25 – P75</th>
              <th className="px-4 py-3">Amplitude</th>
              <th className="px-4 py-3">
                Abaixo de {NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)}
              </th>
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
                <td className="px-4 py-3 text-slate-600">{formatNumber(escola.totalNotasLancadas)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{formatarNota(escola.media)}</td>
                <td className="px-4 py-3 text-slate-600">{formatarNota(escola.mediana)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatarNota(escola.percentil25)} – {formatarNota(escola.percentil75)}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatarNota(escola.amplitude)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {escola.percentualAbaixoDoEsperado === null ? "-" : `${escola.percentualAbaixoDoEsperado.toFixed(1)}%`}
                </td>
              </tr>
            ))}
            {escolas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma nota lançada neste ano letivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
