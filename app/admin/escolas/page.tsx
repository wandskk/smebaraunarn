import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminEscolasPage() {
  const escolas = await prisma.escola.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { servidores: true, estudantes: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Escolas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Base de escolas sincronizada com o SIGEduc. Use{" "}
        <a href="/admin/sincronizacao" className="text-brand-700 underline">
          Sincronização
        </a>{" "}
        para atualizar.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Código INEP</th>
              <th className="px-4 py-3">Servidores</th>
              <th className="px-4 py-3">Estudantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {escolas.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/admin/escolas/${e.id}`} className="hover:text-brand-700 hover:underline">
                    {e.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{e.codigoInep ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{e._count.servidores}</td>
                <td className="px-4 py-3 text-slate-500">{e._count.estudantes}</td>
              </tr>
            ))}
            {escolas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Nenhuma escola sincronizada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
