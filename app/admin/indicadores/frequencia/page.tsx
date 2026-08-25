import Link from "next/link";
import { ArrowLeft, AlertTriangle, LineChart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import {
  getFrequenciaPorEscola,
  getEvolucaoFrequenciaRede,
  calcularJanelaComparativaPadrao,
  resolverDataReferenciaJanela,
  getContagemFaltasConsecutivasPorEscola,
} from "@/lib/queries/frequencia";
import type { FaixaFrequencia, VariacaoFrequencia } from "@/lib/analytics/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { DonutChart, type DonutChartDatum } from "@/components/ui/charts/donut-chart";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { TimeSeriesChart } from "@/components/ui/charts/time-series-chart";
import type { ChartAccent } from "@/components/ui/charts/accent-colors";

const FAIXA_DONUT_LABEL: Record<FaixaFrequencia, string> = { adequada: "Adequada", atencao: "Atenção", critica: "Crítica" };
const FAIXA_RING_ACCENT: Record<FaixaFrequencia, ChartAccent> = { adequada: "success", atencao: "warning", critica: "danger" };

interface PageProps {
  searchParams: { ano?: string };
}

/** Frequência mais alta é sempre favorável — variação temporal, não espacial (ver ComparisonDelta). */
function TendenciaCell({ variacao }: { variacao: VariacaoFrequencia | null }) {
  if (!variacao) return <span className="text-xs text-foreground-muted/60">sem dado no período anterior</span>;

  const { diferencaPontosPercentuais, tendencia } = variacao;
  const texto = `${diferencaPontosPercentuais > 0 ? "+" : ""}${diferencaPontosPercentuais.toFixed(1)} p.p.`;
  const favoravel = tendencia === "estavel" ? null : tendencia === "alta";

  return <ComparisonDelta diferenca={diferencaPontosPercentuais} texto={texto} favoravel={favoravel} />;
}

export default async function FrequenciaPorEscolaPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const [escolas, evolucaoFrequenciaRede] = await Promise.all([
    getFrequenciaPorEscola({ anoLetivo, ...janela }),
    getEvolucaoFrequenciaRede({ inicio: janela.atualInicio, fim: janela.atualFim }),
  ]);
  const semHistoricoParaTendencia = escolas.length > 0 && escolas.every((e) => e.variacao === null);

  const faixaDonutData: DonutChartDatum[] = (
    Object.entries(
      escolas.reduce<Record<string, number>>((acc, e) => {
        if (!e.faixa) return acc;
        acc[e.faixa] = (acc[e.faixa] ?? 0) + 1;
        return acc;
      }, {}),
    ) as [FaixaFrequencia, number][]
  ).map(([faixa, value]) => ({ label: FAIXA_DONUT_LABEL[faixa], value, accent: FAIXA_RING_ACCENT[faixa] }));

  // Sinal de "agora" (sequência de faltas em andamento) só faz sentido para o ano corrente — ver decisão técnica na ETAPA 10.
  const anoCorrente = anoLetivo === new Date().getFullYear();
  const contagemFaltasConsecutivas = anoCorrente ? await getContagemFaltasConsecutivasPorEscola() : new Map();

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-attendance-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Frequência por Escola"
        description={
          <>
            Onde a frequência está piorando? Compara {janela.atualInicio} a {janela.atualFim} com os 30 dias
            anteriores a esse período ({janela.anteriorInicio} a {janela.anteriorFim}). Ano letivo {anoLetivo}. Lista
            ordenada da frequência mais baixa para a mais alta.
          </>
        }
      />

      {semHistoricoParaTendencia && (
        <p className="mt-3 max-w-2xl rounded-lg bg-warning-subtle px-3 py-2 text-sm text-warning-subtle-foreground">
          Nenhuma escola tem tendência calculada ainda: a sincronização de frequência começou há poucos dias, sem
          histórico suficiente para o período de comparação. A tendência aparece automaticamente assim que houver
          dados no período anterior.
        </p>
      )}

      {evolucaoFrequenciaRede.length < 2 ? (
        <EmptyState
          className="mt-4"
          icon={LineChart}
          title="Ainda não há histórico suficiente para calcular tendência."
          description="O gráfico aparecerá automaticamente quando houver dados comparáveis."
        />
      ) : (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Evolução da rede</div>
          <div className="mt-3">
            <TimeSeriesChart
              data={evolucaoFrequenciaRede.map((p) => ({ data: p.data, valor: p.percentual }))}
              accent="attendance"
              unidade="percentual"
            />
          </div>
        </div>
      )}

      {faixaDonutData.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Escolas por faixa</div>
          <div className="mt-3">
            <DonutChart
              data={faixaDonutData}
              size={128}
              thickness={18}
              centerValue={String(escolas.length)}
              centerLabel="escolas"
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Estudantes</TableHeadCell>
              <TableHeadCell>Frequência atual</TableHeadCell>
              <TableHeadCell>Tendência</TableHeadCell>
              <TableHeadCell>Faixa</TableHeadCell>
              {anoCorrente && <TableHeadCell>Faltas consecutivas agora</TableHeadCell>}
            </tr>
          </TableHeader>
          <TableBody>
            {escolas.map((escola) => {
              const contagem = escola.escolaId !== null ? contagemFaltasConsecutivas.get(escola.escolaId) : undefined;
              return (
                <TableRow key={escola.escolaId}>
                  <TableCell>
                    <Link
                      href={`/admin/escolas/${escola.escolaId}`}
                      className="font-medium text-foreground hover:text-attendance-subtle-foreground hover:underline"
                    >
                      {escola.nomeEscola}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground-muted">{formatNumber(escola.totalEstudantes)}</TableCell>
                  <TableCell>
                    {escola.percentualAtual === null ? (
                      <span className="text-foreground-muted/60">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RingProgress
                          value={escola.percentualAtual}
                          accent={escola.faixa ? FAIXA_RING_ACCENT[escola.faixa] : "primary"}
                          size={36}
                          strokeWidth={5}
                          valueLabel=""
                        />
                        <span className="font-semibold text-foreground">{escola.percentualAtual.toFixed(1)}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <TendenciaCell variacao={escola.variacao} />
                  </TableCell>
                  <TableCell>
                    <FaixaBadge faixa={escola.faixa} />
                  </TableCell>
                  {anoCorrente && (
                    <TableCell>
                      {contagem && contagem.total > 0 ? (
                        <Link
                          href={`/admin/escolas/${escola.escolaId}`}
                          className="inline-flex items-center gap-1 text-warning-subtle-foreground hover:underline"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {contagem.total} aluno(s)
                          {contagem.critico > 0 && ` (${contagem.critico} crítico)`}
                        </Link>
                      ) : (
                        <span className="text-foreground-muted/60">0</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {escolas.length === 0 && (
              <TableEmptyState colSpan={anoCorrente ? 6 : 5} title="Nenhuma escola com frequência registrada neste ano letivo." />
            )}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
