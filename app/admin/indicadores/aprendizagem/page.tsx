import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDesempenhoPorEscola, getDisciplinasComNota, NOTA_MINIMA_ESPERADA_PADRAO } from "@/lib/queries/desempenho";
import { TOTAL_UNIDADES_ANO } from "@/components/portal/grade-table";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { ano?: string; disciplina?: string; unidade?: string };
}

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

export default async function AprendizagemPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);
  const disciplina = searchParams.disciplina?.trim() || undefined;
  const unidade = searchParams.unidade ? Number(searchParams.unidade) : undefined;

  const [escolas, disciplinasDisponiveis] = await Promise.all([
    getDesempenhoPorEscola({ anoLetivo, disciplina, unidade }),
    getDisciplinasComNota(anoLetivo),
  ]);

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
            confirmado pela Secretaria — ver docs/PLANO_DESENVOLVIMENTO.md). Ano letivo {anoLetivo}
            {disciplina && ` · ${disciplina}`}
            {unidade && ` · ${unidade}ª unidade`}. Lista ordenada da média mais baixa para a mais alta.
          </>
        }
      />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
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
