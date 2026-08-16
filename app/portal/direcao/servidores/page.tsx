import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoServidoresPage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = {
    escolaId: session.escolaId!,
    ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [servidores, total] = await Promise.all([
    prisma.servidor.findMany({ where, orderBy: { nome: "asc" }, skip, take }),
    prisma.servidor.count({ where }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Servidores</h1>
      <p className="mt-1 text-sm text-slate-500">{total} servidor(es) lotado(s) na escola.</p>

      <ListToolbar searchPlaceholder="Buscar por nome..." />

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Função</th>
              <th className="px-4 py-3">Vínculo</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servidores.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.nome}</td>
                <td className="px-4 py-3 text-slate-500">{s.cargo ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{s.funcao ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{s.tipoVinculo ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{s.status ?? "-"}</td>
              </tr>
            ))}
            {servidores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhum servidor encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/direcao/servidores"
        searchParams={searchParams}
      />
    </div>
  );
}
