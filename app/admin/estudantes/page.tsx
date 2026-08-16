import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: { q?: string };
}

export default async function AdminEstudantesPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();

  const estudantes = await prisma.estudante.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { matricula: { contains: q } },
            { cpf: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
    take: 100,
    include: { escola: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Estudantes</h1>
      <p className="mt-1 text-sm text-slate-500">Base sincronizada com o SIGEduc.</p>

      <form className="mt-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, matrícula ou CPF..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Escola</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estudantes.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{e.nome}</td>
                <td className="px-4 py-3 text-slate-500">{e.matricula}</td>
                <td className="px-4 py-3 text-slate-500">{e.turmaSerie ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{e.escola?.nome ?? e.nomeEscola ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/estudantes/${e.id}`} className="text-brand-700 hover:underline">
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
    </div>
  );
}
