import Link from "next/link";
import { ArrowLeft, Award, FileText, School, TrendingDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import {
  getDesempenhoPorEscola,
  getDistribuicaoNotasRede,
  getDisciplinasComNota,
  NOTA_MINIMA_ESPERADA_PADRAO,
} from "@/lib/queries/desempenho";
import { getPainelAtencaoEscolas } from "@/lib/queries/atencao";
import { calcularMediaPonderada } from "@/lib/analytics/comparativos";
import { TOTAL_UNIDADES_ANO } from "@/components/portal/grade-table";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { EmptyState } from "@/components/ui/empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { MiniBarChart, type MiniBarDatum } from "@/components/ui/charts/mini-bar-chart";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/ui/charts/horizontal-bar-chart";

interface PageProps {
  searchParams: { ano?: string; disciplina?: string; unidade?: string };
}

const MAXIMO_ESCOLAS_NO_GRAFICO = 10;

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

export default async function AprendizagemPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);
  const disciplina = searchParams.disciplina?.trim() || undefined;
  const unidade = searchParams.unidade ? Number(searchParams.unidade) : undefined;
  const comAno = (href: string) => `${href}?ano=${anoLetivo}`;

  const [escolas, disciplinasDisponiveis, histograma, painelEscolas] = await Promise.all([
    getDesempenhoPorEscola({ anoLetivo, disciplina, unidade }),
    getDisciplinasComNota(anoLetivo),
    getDistribuicaoNotasRede({ anoLetivo, disciplina, unidade }),
    getPainelAtencaoEscolas(anoLetivo),
  ]);

  const totalNotas = escolas.reduce((acc, e) => acc + e.totalNotasLancadas, 0);
  const desempenhoMedioRede = calcularMediaPonderada(
    escolas.filter((e) => e.media !== null).map((e) => ({ valor: e.media as number, peso: e.totalNotasLancadas })),
  );
  const percentualAbaixoRede = calcularMediaPonderada(
    escolas
      .filter((e) => e.percentualAbaixoDoEsperado !== null)
      .map((e) => ({ valor: e.percentualAbaixoDoEsperado as number, peso: e.totalNotasLancadas })),
  );
  const escolasComSinalAprendizagem = painelEscolas.filter((e) => e.sinais.aprendizagem !== undefined).length;

  const histogramaData: MiniBarDatum[] = histograma.map((b) => ({ label: b.label, value: b.quantidade, accent: "education" }));

  const escolasComMedia = escolas.filter((e) => e.media !== null && e.escolaId !== null);
  const menoresMedias = [...escolasComMedia].sort((a, b) => (a.media as number) - (b.media as number)).slice(0, MAXIMO_ESCOLAS_NO_GRAFICO);
  const graficoLimitado = escolasComMedia.length > MAXIMO_ESCOLAS_NO_GRAFICO;
  const barrasDesempenho: HorizontalBarDatum[] = [...menoresMedias]
    .reverse() // recharts layout="vertical" desenha de baixo para cima — reverte para a menor média ficar no topo
    .map((e) => ({ label: e.nomeEscola, value: e.media as number, valueLabel: formatarNota(e.media), accent: "education" }));

  return (
    <div>
      <Link href={comAno("/admin/indicadores")} className="inline-flex items-center gap-1 text-sm text-education-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Aprendizagem e Desempenho"
        description={
          <>
            Como os resultados se distribuem entre escolas e onde há maior concentração de notas abaixo do parâmetro
            de trabalho? Duas escolas com a mesma média podem ter realidades bem diferentes — por isso a distribuição
            importa mais que a média isolada. A proporção abaixo de {NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)} usa o
            critério provisório de aprovação (ainda não confirmado pela Secretaria — ver
            docs/PLANO_DESENVOLVIMENTO.md). Ano letivo {anoLetivo}
            {disciplina && ` · ${disciplina}`}
            {unidade && ` · ${unidade}ª unidade`}. Tabela ordenada da média mais baixa para a mais alta.
          </>
        }
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Desempenho médio da rede"
          value={formatarNota(desempenhoMedioRede)}
          icon={Award}
          accent="education"
        />
        <MetricCard
          label="Notas lançadas no recorte"
          value={formatNumber(totalNotas)}
          icon={FileText}
          accent="education"
        />
        <MetricCard
          label={`Abaixo do parâmetro (${NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)})`}
          value={percentualAbaixoRede === null ? "-" : `${percentualAbaixoRede.toFixed(0)}%`}
          icon={TrendingDown}
          tone={percentualAbaixoRede !== null && percentualAbaixoRede >= 40 ? "atencao" : "default"}
          accent="education"
        />
        <MetricCard
          label="Escolas com sinal de atenção"
          value={formatNumber(escolasComSinalAprendizagem)}
          icon={School}
          tone={escolasComSinalAprendizagem > 0 ? "atencao" : "default"}
          accent="education"
          helpText="mesmo critério de Atenção agora, sem filtro de disciplina/unidade"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Distribuição de notas</div>
          {totalNotas === 0 ? (
            <EmptyState className="mt-3" icon={FileText} title="Nenhuma nota lançada neste recorte." />
          ) : (
            <div className="mt-3">
              <MiniBarChart data={histogramaData} accent="education" height={180} />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {graficoLimitado ? "Menores médias no recorte" : "Desempenho por escola"}
          </div>
          {barrasDesempenho.length === 0 ? (
            <EmptyState className="mt-3" icon={School} title="Nenhuma escola com nota neste recorte." />
          ) : (
            <div className="mt-3">
              <HorizontalBarChart
                data={barrasDesempenho}
                accent="education"
                referencia={desempenhoMedioRede ?? undefined}
              />
              {graficoLimitado && (
                <p className="mt-2 text-xs text-foreground-muted/70">
                  Mostrando as {MAXIMO_ESCOLAS_NO_GRAFICO} menores médias de {escolasComMedia.length} escolas — a
                  tabela completa está abaixo. Linha tracejada = média da rede.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        {searchParams.ano && <input type="hidden" name="ano" value={searchParams.ano} />}
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Disciplina</label>
          <Select name="disciplina" defaultValue={searchParams.disciplina ?? ""}>
            <option value="">Todas</option>
            {disciplinasDisponiveis.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs text-foreground-muted">Unidade</label>
          <Select name="unidade" defaultValue={searchParams.unidade ?? ""}>
            <option value="">Todas</option>
            {Array.from({ length: TOTAL_UNIDADES_ANO }, (_, i) => i + 1).map((u) => (
              <option key={u} value={u}>
                {u}ª unidade
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(disciplina || unidade) && (
          <Link
            href={searchParams.ano ? `/admin/indicadores/aprendizagem?ano=${searchParams.ano}` : "/admin/indicadores/aprendizagem"}
            className="text-sm text-primary hover:underline"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Notas lançadas</TableHeadCell>
              <TableHeadCell>Média</TableHeadCell>
              <TableHeadCell>Mediana</TableHeadCell>
              <TableHeadCell>P25 – P75</TableHeadCell>
              <TableHeadCell>Amplitude</TableHeadCell>
              <TableHeadCell>Abaixo de {NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)}</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {escolas.map((escola) => (
              <TableRow key={escola.escolaId ?? escola.nomeEscola}>
                <TableCell>
                  {escola.escolaId !== null ? (
                    <Link
                      href={comAno(`/admin/escolas/${escola.escolaId}`)}
                      className="font-medium text-foreground hover:text-education-subtle-foreground hover:underline"
                    >
                      {escola.nomeEscola}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{escola.nomeEscola}</span>
                  )}
                </TableCell>
                <TableCell className="text-foreground-muted">{formatNumber(escola.totalNotasLancadas)}</TableCell>
                <TableCell className="font-semibold text-foreground">{formatarNota(escola.media)}</TableCell>
                <TableCell className="text-foreground-muted">{formatarNota(escola.mediana)}</TableCell>
                <TableCell className="text-foreground-muted">
                  {formatarNota(escola.percentil25)} – {formatarNota(escola.percentil75)}
                </TableCell>
                <TableCell className="text-foreground-muted">{formatarNota(escola.amplitude)}</TableCell>
                <TableCell>
                  {escola.percentualAbaixoDoEsperado === null ? (
                    <span className="text-foreground-muted/60">-</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RingProgress
                        value={escola.percentualAbaixoDoEsperado}
                        accent="education"
                        size={36}
                        strokeWidth={5}
                        valueLabel=""
                      />
                      <span className="text-foreground-muted">{escola.percentualAbaixoDoEsperado.toFixed(1)}%</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {escolas.length === 0 && <TableEmptyState colSpan={7} title="Nenhuma nota lançada neste ano letivo." />}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
