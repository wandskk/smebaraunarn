import Link from "next/link";
import { ArrowLeft, AlertTriangle, TrendingDown, Users2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDistorcaoPorEscolaESerie } from "@/lib/queries/distorcao";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import type { SerieEnsino } from "@/lib/analytics/distorcao";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/ui/charts/horizontal-bar-chart";

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
  const comAno = (href: string) => `${href}?ano=${anoLetivo}`;

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const [{ porEscola, porSerie }, { escolas: comparativos }] = await Promise.all([
    getDistorcaoPorEscolaESerie({ anoLetivo }),
    getComparativosPorEscola({ anoLetivo, ...janela }),
  ]);
  const diferencaRedePorEscola = new Map(comparativos.map((e) => [e.escolaId, e.distorcaoDiferencaRede]));

  const totalElegiveisRede = porEscola.reduce((acc, e) => acc + e.totalElegiveis, 0);
  const totalEmDistorcaoRede = porEscola.reduce((acc, e) => acc + e.emDistorcao, 0);
  const totalSeveraRede = porEscola.reduce((acc, e) => acc + e.intensidadeSevera, 0);
  const totalForaDoEscopoRede = porEscola.reduce((acc, e) => acc + e.totalForaDoEscopo, 0);
  const percentualDistorcaoRede = totalElegiveisRede > 0 ? (totalEmDistorcaoRede / totalElegiveisRede) * 100 : null;

  const barrasPorSerie: HorizontalBarDatum[] = [...porSerie]
    .reverse() // recharts desenha de baixo para cima — reverte para 1º Ano ficar no topo
    .map((item) => ({
      label: ROTULO_SERIE[item.serie],
      value: item.percentualDistorcao ?? 0,
      valueLabel: `${formatarPercentual(item.percentualDistorcao)} (${formatNumber(item.emDistorcao)} de ${formatNumber(item.totalElegiveis)})`,
      accent: "warning",
    }));

  return (
    <div>
      <Link href={comAno("/admin/indicadores")} className="inline-flex items-center gap-1 text-sm text-warning-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Fluxo e Trajetória Escolar"
        description={
          <>
            Onde a distorção idade-série está concentrada e em quais etapas ela começa a crescer? Ano letivo{" "}
            {anoLetivo}.
          </>
        }
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Distorção idade-série da rede"
          value={formatarPercentual(percentualDistorcaoRede)}
          icon={TrendingDown}
          accent="warning"
        />
        <MetricCard
          label="Estudantes em distorção"
          value={formatNumber(totalEmDistorcaoRede)}
          icon={Users2}
          accent="warning"
        />
        <MetricCard
          label="Defasagem severa (4+ anos)"
          value={formatNumber(totalSeveraRede)}
          icon={AlertTriangle}
          tone={totalSeveraRede > 0 ? "atencao" : "default"}
          accent="warning"
        />
        <MetricCard
          label="Fora do escopo do cálculo"
          value={formatNumber(totalForaDoEscopoRede)}
          icon={Users2}
          accent="warning"
          helpText="Educação Infantil, EJA, Educação Especial, turmas multianuais, Trajetória de Sucesso, ou sem data de nascimento válida"
        />
      </div>

      <details className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-foreground-muted">
        <summary className="cursor-pointer font-medium text-foreground">Como este indicador é calculado</summary>
        <p className="mt-2">
          Percentual calculado só sobre estudantes elegíveis (série regular mapeada + data de nascimento válida) —
          Educação Infantil, EJA, Educação Especial, turmas multianuais e a trilha Trajetória de Sucesso ficam fora,
          por definição, e entram só na contagem &quot;Fora do escopo do cálculo&quot; acima. Distorção considera a diferença
          entre a idade do estudante na data de referência e a idade esperada para a série (metodologia INEP, limiar
          de 2 anos); defasagem severa é a partir de 4 anos.
        </p>
      </details>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        Por série — em qual série a distorção se concentra?
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-surface p-5">
        {barrasPorSerie.length === 0 ? (
          <p className="text-sm text-foreground-muted/60">Nenhum estudante elegível neste ano letivo.</p>
        ) : (
          <HorizontalBarChart data={barrasPorSerie} accent="warning" />
        )}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Por escola</h2>
      <div className="mt-3">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Elegíveis</TableHeadCell>
              <TableHeadCell>Em distorção</TableHeadCell>
              <TableHeadCell>% distorção</TableHeadCell>
              <TableHeadCell>vs. rede</TableHeadCell>
              <TableHeadCell>Defasagem severa (4+ anos)</TableHeadCell>
              <TableHeadCell>Fora do escopo</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {porEscola.map((escola) => {
              const diferencaRede = escola.escolaId !== null ? (diferencaRedePorEscola.get(escola.escolaId) ?? null) : null;
              return (
                <TableRow key={escola.escolaId ?? escola.nomeEscola}>
                  <TableCell>
                    {escola.escolaId !== null ? (
                      <Link
                        href={comAno(`/admin/escolas/${escola.escolaId}`)}
                        className="font-medium text-foreground hover:text-warning-subtle-foreground hover:underline"
                      >
                        {escola.nomeEscola}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{escola.nomeEscola}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground-muted">{formatNumber(escola.totalElegiveis)}</TableCell>
                  <TableCell className="text-foreground-muted">{formatNumber(escola.emDistorcao)}</TableCell>
                  <TableCell>
                    {escola.percentualDistorcao === null ? (
                      <span className="text-foreground-muted/60">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RingProgress value={escola.percentualDistorcao} accent="warning" size={36} strokeWidth={5} valueLabel="" />
                        <span className="font-semibold text-foreground">{escola.percentualDistorcao.toFixed(1)}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {diferencaRede === null ? (
                      <span className="text-xs text-foreground-muted/60">sem referência</span>
                    ) : (
                      <ComparisonDelta
                        diferenca={diferencaRede}
                        texto={`${diferencaRede > 0 ? "+" : ""}${diferencaRede.toFixed(1)} p.p.`}
                        favoravel={Math.abs(diferencaRede) < 0.05 ? null : diferencaRede < 0}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-foreground-muted">{formatNumber(escola.intensidadeSevera)}</TableCell>
                  <TableCell className="text-foreground-muted/60">{formatNumber(escola.totalForaDoEscopo)}</TableCell>
                </TableRow>
              );
            })}
            {porEscola.length === 0 && (
              <TableEmptyState colSpan={7} title="Nenhuma escola com estudantes elegíveis neste ano letivo." />
            )}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
