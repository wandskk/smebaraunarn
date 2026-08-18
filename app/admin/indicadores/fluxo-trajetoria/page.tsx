import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDistorcaoPorEscolaESerie } from "@/lib/queries/distorcao";
import type { SerieEnsino } from "@/lib/analytics/distorcao";

interface PageProps {
  searchParams: { ano?: string };
}

const ROTULO_SERIE: Record<SerieEnsino, string> = {
  EF_1: "1º Ano",
  EF_2: "2º Ano",
  EF_3: "3º Ano",
  EF_4: "4º Ano",
  EF_5: "5º Ano",
  EF_6: "6º Ano",
  EF_7: "7º Ano",
  EF_8: "8º Ano",
  EF_9: "9º Ano",
  EM_1: "1ª Série EM",
  EM_2: "2ª Série EM",
  EM_3: "3ª Série EM",
};

function formatarPercentual(valor: number | null): string {
  return valor === null ? "-" : `${valor.toFixed(1)}%`;
}

export default async function FluxoTrajetoriaPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const { porEscola, porSerie } = await getDistorcaoPorEscolaESerie({ anoLetivo });

  const maiorPercentualSerie = Math.max(0, ...porSerie.map((s) => s.percentualDistorcao ?? 0));

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Fluxo e Trajetória — Distorção Idade-Série</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Onde está a maior concentração de distorção e em qual etapa ela começa a crescer? Percentual calculado só
        sobre estudantes elegíveis (série regular mapeada + data de nascimento válida) — Educação Infantil, EJA,
        Educação Especial, turmas multianuais e a trilha Trajetória de Sucesso ficam fora, por definição. Ano
        letivo {anoLetivo}.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Por série</h2>
      <div className="mt-3 space-y-2">
        {porSerie.map((item) => {
          const largura = maiorPercentualSerie > 0 ? ((item.percentualDistorcao ?? 0) / maiorPercentualSerie) * 100 : 0;
          return (
            <div key={item.serie} className="flex items-center gap-3 text-sm">
              <div className="w-24 shrink-0 text-slate-600">{ROTULO_SERIE[item.serie]}</div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${largura}%` }} />
              </div>
              <div className="w-32 shrink-0 text-right text-slate-600">
                {formatarPercentual(item.percentualDistorcao)} ({formatNumber(item.emDistorcao)} de{" "}
                {formatNumber(item.totalElegiveis)})
              </div>
            </div>
          );
        })}
        {porSerie.length === 0 && <p className="text-sm text-slate-400">Nenhum estudante elegível neste ano letivo.</p>}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Por escola</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3">Elegíveis</th>
              <th className="px-4 py-3">Em distorção</th>
              <th className="px-4 py-3">% distorção</th>
              <th className="px-4 py-3">Defasagem severa (4+ anos)</th>
              <th className="px-4 py-3">Fora do escopo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {porEscola.map((escola) => (
              <tr key={escola.escolaId}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/escolas/${escola.escolaId}`}
                    className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                  >
                    {escola.nomeEscola}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(escola.totalElegiveis)}</td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(escola.emDistorcao)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatarPercentual(escola.percentualDistorcao)}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(escola.intensidadeSevera)}</td>
                <td className="px-4 py-3 text-slate-400">{formatNumber(escola.totalForaDoEscopo)}</td>
              </tr>
            ))}
            {porEscola.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma escola com estudantes elegíveis neste ano letivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
