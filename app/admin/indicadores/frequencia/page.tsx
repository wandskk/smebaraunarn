import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getFrequenciaPorEscola, calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import type { VariacaoFrequencia } from "@/lib/analytics/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

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
  const escolas = await getFrequenciaPorEscola({ anoLetivo, ...janela });
  const semHistoricoParaTendencia = escolas.length > 0 && escolas.every((e) => e.variacao === null);

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

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Estudantes</TableHeadCell>
              <TableHeadCell>Frequência atual</TableHeadCell>
              <TableHeadCell>Tendência</TableHeadCell>
              <TableHeadCell>Faixa</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {escolas.map((escola) => (
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
                <TableCell className="font-semibold text-foreground">
                  {escola.percentualAtual === null ? "-" : `${escola.percentualAtual.toFixed(1)}%`}
                </TableCell>
                <TableCell>
                  <TendenciaCell variacao={escola.variacao} />
                </TableCell>
                <TableCell>
                  <FaixaBadge faixa={escola.faixa} />
                </TableCell>
              </TableRow>
            ))}
            {escolas.length === 0 && (
              <TableEmptyState colSpan={5} title="Nenhuma escola com frequência registrada neste ano letivo." />
            )}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
