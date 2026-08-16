import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function DirecaoServidoresPage() {
  const session = await requireSession(["DIRETOR"]);
  const servidores = await prisma.servidor.findMany({
    where: { escolaId: session.escolaId! },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Servidores</h1>
      <p className="mt-1 text-sm text-slate-500">{servidores.length} servidor(es) lotado(s) na escola.</p>

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
                  Nenhum servidor sincronizado para esta escola.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
