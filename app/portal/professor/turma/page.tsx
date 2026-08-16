import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function TurmaPage({ searchParams }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const nomesTurma = servidor.turmas.map((t) => t.turma);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where =
    nomesTurma.length === 0
      ? null
      : {
          escolaId: servidor.escolaId ?? -1,
          turmaSerie: { in: nomesTurma },
          ...(q
            ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { matricula: { contains: q } }] }
            : {}),
        };

  const [alunos, total] = where
    ? await Promise.all([
        prisma.estudante.findMany({
          where,
          orderBy: [{ turmaSerie: "asc" }, { nome: "asc" }],
          skip,
          take,
        }),
        prisma.estudante.count({ where }),
      ])
    : [[], 0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Minhas Turmas</h1>
      <p className="mt-1 text-sm text-slate-500">
        {nomesTurma.length > 0 ? nomesTurma.join(", ") : "Nenhuma turma vinculada"} ·{" "}
        {servidor.escolaNome ?? "Escola"} · {total} aluno(s)
      </p>

      {nomesTurma.length > 0 && <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />}

      {alunos.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhum aluno enturmado encontrado para suas turmas.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{aluno.nome}</td>
                  <td className="px-4 py-3 text-slate-500">{aluno.matricula}</td>
                  <td className="px-4 py-3 text-slate-500">{aluno.turmaSerie ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/portal/professor/turma/${aluno.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/professor/turma"
        searchParams={searchParams}
      />
    </div>
  );
}
