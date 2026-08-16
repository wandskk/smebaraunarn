import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoEstudantesPage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = {
    escolaId: session.escolaId!,
    ...(q
      ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { matricula: { contains: q } }] }
      : {}),
  };

  const [estudantes, total] = await Promise.all([
    prisma.estudante.findMany({ where, orderBy: { nome: "asc" }, skip, take }),
    prisma.estudante.count({ where }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Estudantes</h1>
      <p className="mt-1 text-sm text-slate-500">{total} estudante(s) enturmado(s).</p>

      <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estudantes.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{e.nome}</td>
                <td className="px-4 py-3 text-slate-500">{e.matricula}</td>
                <td className="px-4 py-3 text-slate-500">{e.turmaSerie ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{e.nomeResponsavel ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/portal/direcao/alunos/${e.id}`} className="text-brand-700 hover:underline">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
            {estudantes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhum estudante encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/direcao/estudantes"
        searchParams={searchParams}
      />
    </div>
  );
}
