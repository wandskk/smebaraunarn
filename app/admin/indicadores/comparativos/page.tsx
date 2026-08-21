import Link from "next/link";
import { ArrowLeft, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

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
  if (diferenca === null) return <span className="text-xs text-foreground-muted/60">sem referência de rede</span>;

  const estavel = Math.abs(diferenca) < 0.05;
  const favoravel = estavel ? null : maiorEhMelhor ? diferenca > 0 : diferenca < 0;
  const texto = `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)} ${unidade}`;

  if (estavel) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-foreground-muted/60">
        <Minus className="h-3.5 w-3.5" /> {texto} da rede
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${favoravel ? "text-success" : "text-danger"}`}>
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
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Comparativos — Escola × Rede"
        description={
          <>
            Cada escola comparada com a referência de rede no mesmo recorte, em vez do número isolado. A referência de
            rede é uma média ponderada pelo tamanho de cada escola no indicador (aulas dadas, notas lançadas ou
            estudantes elegíveis) — não a média simples das escolas, que daria peso igual a uma escola pequena e a uma
            grande. Frequência: {janela.atualInicio} a {janela.atualFim}. Ano letivo {anoLetivo}.
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs uppercase text-foreground-muted">Frequência da rede</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{formatarPercentual(rede.frequenciaPercentual)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase text-foreground-muted">Desempenho médio da rede</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{formatarNota(rede.desempenhoMedia)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase text-foreground-muted">Distorção idade-série da rede</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{formatarPercentual(rede.distorcaoPercentual)}</div>
        </Card>
      </div>

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Frequência</TableHeadCell>
              <TableHeadCell>Faixa</TableHeadCell>
              <TableHeadCell>Desempenho</TableHeadCell>
              <TableHeadCell>Distorção idade-série</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {escolas.map((escola) => (
              <TableRow key={escola.escolaId ?? escola.nomeEscola}>
                <TableCell>
                  {escola.escolaId !== null ? (
                    <Link
                      href={`/admin/escolas/${escola.escolaId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {escola.nomeEscola}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{escola.nomeEscola}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">{formatarPercentual(escola.frequenciaPercentual)}</div>
                  <DiferencaRede diferenca={escola.frequenciaDiferencaRede} unidade="p.p." maiorEhMelhor />
                </TableCell>
                <TableCell>
                  <FaixaBadge faixa={escola.frequenciaFaixa} />
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">{formatarNota(escola.desempenhoMedia)}</div>
                  <DiferencaRede diferenca={escola.desempenhoDiferencaRede} unidade="pts" maiorEhMelhor />
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">{formatarPercentual(escola.distorcaoPercentual)}</div>
                  <DiferencaRede diferenca={escola.distorcaoDiferencaRede} unidade="p.p." maiorEhMelhor={false} />
                </TableCell>
              </TableRow>
            ))}
            {escolas.length === 0 && <TableEmptyState colSpan={5} title="Nenhuma escola com dado neste ano letivo." />}
          </TableBody>
        </DataTable>
      </div>

      <p className="mt-4 text-xs text-foreground-muted/60">
        {formatNumber(escolas.length)} escola(s) com pelo menos um indicador calculado. Uma célula vazia
        (&quot;sem referência de rede&quot;) acontece quando a escola não tem dado suficiente para esse indicador
        específico (ex.: creche sem estudante elegível para distorção idade-série).
      </p>
    </div>
  );
}
