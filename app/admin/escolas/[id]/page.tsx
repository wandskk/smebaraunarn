import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTurmaLabel, getTurmasDaEscola } from "@/lib/queries/academico";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  params: { id: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminEscolaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

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
      <Link href="/admin/escolas" className="text-sm text-brand-700 hover:underline">
        ← Escolas
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">{escola.nome}</h1>
      <p className="mt-1 text-sm text-slate-500">Código INEP {escola.codigoInep ?? "-"}</p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Turmas</h2>
      {todasTurmas.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por turma..." />
          {turmas.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
              Nenhuma turma encontrada.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((t) => (
                <Link
                  key={t.turma}
                  href={`/admin/escolas/${escolaId}/turmas/${encodeURIComponent(t.turma)}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <Users className="h-6 w-6 shrink-0 text-brand-600" />
                  <div>
                    <div className="font-semibold text-slate-900">{formatTurmaLabel(t.serie, t.turma)}</div>
                    <div className="text-xs text-slate-400">{t.turma}</div>
                    <div className="text-sm text-slate-500">{t.totalAlunos} aluno(s)</div>
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
