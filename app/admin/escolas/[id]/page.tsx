import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTurmaLabel, getTurmasDaEscola } from "@/lib/queries/academico";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import { resolverAnoLetivo } from "@/lib/utils";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SchoolOverview } from "@/components/portal/school-overview";

interface PageProps {
  params: { id: string };
  searchParams: { q?: string; page?: string; pageSize?: string; ano?: string };
}

export default async function AdminEscolaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], where: { escolaId }, orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const { escolas: comparativos } = await getComparativosPorEscola({ anoLetivo, ...janela });
  const comparativo = comparativos.find((c) => c.escolaId === escolaId) ?? null;

  const todasTurmas = await getTurmasDaEscola(escolaId);
  const q = searchParams.q?.trim().toLowerCase();
  const turmasFiltradas = q
    ? todasTurmas.filter(
        (t) => formatTurmaLabel(t.serie, t.turma).toLowerCase().includes(q) || t.turma.toLowerCase().includes(q),
      )
    : todasTurmas;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const turmas = turmasFiltradas.slice(skip, skip + take);

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/admin/escolas" className="text-primary hover:underline">
            ← Escolas
          </Link>
        }
        title={escola.nome}
        description={`Código INEP ${escola.codigoInep ?? "-"}`}
        actions={
          anosDisponiveis.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <Select name="ano" defaultValue={anoLetivo}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    Ano letivo {ano}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Aplicar
              </Button>
            </form>
          )
        }
      />

      <h2 className="mt-6 text-sm font-semibold text-foreground">Comparação com a rede — {anoLetivo}</h2>
      <div className="mt-3">
        <SchoolOverview comparativo={comparativo} anoLetivo={anoLetivo} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Turmas</h2>
      {todasTurmas.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por turma..." />
          {turmas.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
              Nenhuma turma encontrada.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((t) => (
                <Link
                  key={t.turma}
                  href={`/admin/escolas/${escolaId}/turmas/${encodeURIComponent(t.turma)}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-card"
                >
                  <Users className="h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">{formatTurmaLabel(t.serie, t.turma)}</div>
                    <div className="text-xs text-foreground-muted/70">{t.turma}</div>
                    <div className="text-sm text-foreground-muted">{t.totalAlunos} aluno(s)</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPagesFor(turmasFiltradas.length, pageSize)}
            basePath={`/admin/escolas/${escolaId}`}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
