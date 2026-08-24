import Link from "next/link";
import { Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { formatTurmaLabel, getTurmasDaEscola } from "@/lib/queries/academico";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoTurmasPage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const todasTurmas = await getTurmasDaEscola(session.escolaId!);

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
      <PageHeader title="Turmas" description="Selecione uma turma para ver alunos, notas e frequência." />

      {todasTurmas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por turma..." />
          {turmas.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
              Nenhuma turma encontrada.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((t) => (
                <Link
                  key={t.turma}
                  href={`/portal/direcao/turmas/${encodeURIComponent(t.turma)}`}
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
            basePath="/portal/direcao/turmas"
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
