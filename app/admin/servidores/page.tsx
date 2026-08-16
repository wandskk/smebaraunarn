import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import { classifyServidorRole } from "@/lib/roles";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { EscolaSelect } from "./escola-select";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

const ROLE_LABEL: Record<string, string> = {
  DIRETOR: "Direção",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor Geral",
};

export default async function AdminServidoresPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { cpf: { contains: q } }] }
    : undefined;

  const [servidores, total, escolas] = await Promise.all([
    prisma.servidor.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { escola: true },
    }),
    prisma.servidor.count({ where }),
    prisma.escola.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Servidores</h1>
      <p className="mt-1 text-sm text-slate-500">
        Base sincronizada com o SIGEduc. Cargos de direção/coordenação vêm sem escola vinculada na
        origem (ficam lotados na Secretaria) — atribua manualmente abaixo. {total} servidor(es).
      </p>

      <ListToolbar searchPlaceholder="Buscar por nome ou CPF..." />

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Papel no portal</th>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servidores.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.nome}</td>
                <td className="px-4 py-3 text-slate-500">{formatCpf(s.cpf)}</td>
                <td className="px-4 py-3 text-slate-500">{s.cargo ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {ROLE_LABEL[classifyServidorRole(s.cargo, s.funcao)]}
                </td>
                <td className="px-4 py-3">
                  <EscolaSelect servidorId={s.id} escolaId={s.escolaId} escolas={escolas} />
                </td>
                <td className="px-4 py-3 text-slate-500">{s.status ?? "-"}</td>
              </tr>
            ))}
            {servidores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
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
        basePath="/admin/servidores"
        searchParams={searchParams}
      />
    </div>
  );
}
