import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getDistorcaoPorEscolaESerie } from "@/lib/queries/distorcao";
import type { SerieEnsino } from "@/lib/analytics/distorcao";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";

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
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-warning-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Fluxo e Trajetória — Distorção Idade-Série"
        description={
          <>
            Onde está a maior concentração de distorção e em qual etapa ela começa a crescer? Percentual calculado só
            sobre estudantes elegíveis (série regular mapeada + data de nascimento válida) — Educação Infantil, EJA,
            Educação Especial, turmas multianuais e a trilha Trajetória de Sucesso ficam fora, por definição. Ano
            letivo {anoLetivo}.
          </>
        }
      />

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Por série</h2>
      <div className="mt-3 space-y-2">
        {porSerie.map((item) => {
          const largura = maiorPercentualSerie > 0 ? ((item.percentualDistorcao ?? 0) / maiorPercentualSerie) * 100 : 0;
          return (
            <div key={item.serie} className="flex items-center gap-3 text-sm">
              <div className="w-24 shrink-0 text-foreground-muted">{ROTULO_SERIE[item.serie]}</div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-warning" style={{ width: `${largura}%` }} />
              </div>
              <div className="w-32 shrink-0 text-right text-foreground-muted">
                {formatarPercentual(item.percentualDistorcao)} ({formatNumber(item.emDistorcao)} de{" "}
                {formatNumber(item.totalElegiveis)})
              </div>
            </div>
          );
        })}
        {porSerie.length === 0 && <p className="text-sm text-foreground-muted/60">Nenhum estudante elegível neste ano letivo.</p>}
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
              <TableHeadCell>Defasagem severa (4+ anos)</TableHeadCell>
              <TableHeadCell>Fora do escopo</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {porEscola.map((escola) => (
              <TableRow key={escola.escolaId ?? escola.nomeEscola}>
                <TableCell>
                  {escola.escolaId !== null ? (
                    <Link
                      href={`/admin/escolas/${escola.escolaId}`}
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
                <TableCell className="text-foreground-muted">{formatNumber(escola.intensidadeSevera)}</TableCell>
                <TableCell className="text-foreground-muted/60">{formatNumber(escola.totalForaDoEscopo)}</TableCell>
              </TableRow>
            ))}
            {porEscola.length === 0 && (
              <TableEmptyState colSpan={6} title="Nenhuma escola com estudantes elegíveis neste ano letivo." />
            )}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
