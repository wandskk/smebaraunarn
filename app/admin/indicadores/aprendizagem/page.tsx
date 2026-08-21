import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDesempenhoPorEscola, NOTA_MINIMA_ESPERADA_PADRAO } from "@/lib/queries/desempenho";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

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
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-education-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Aprendizagem por Escola"
        description={
          <>
            Duas escolas com a mesma média podem ter realidades bem diferentes — por isso a distribuição importa
            mais que a média isolada. Mediana e percentis (P25/P75) mostram a nota típica e a dispersão; a proporção
            abaixo de {NOTA_MINIMA_ESPERADA_PADRAO.toFixed(1)} usa o critério provisório de aprovação (ainda não
            confirmado pela Secretaria — ver docs/PLANO_DESENVOLVIMENTO.md). Ano letivo {anoLetivo}. Lista ordenada
            da média mais baixa para a mais alta.
          </>
        }
      />

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
                      href={`/admin/escolas/${escola.escolaId}`}
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
                <TableCell className="text-foreground-muted">
                  {escola.percentualAbaixoDoEsperado === null ? "-" : `${escola.percentualAbaixoDoEsperado.toFixed(1)}%`}
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
