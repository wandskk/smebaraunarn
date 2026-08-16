import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function DirecaoEstudantesPage() {
  const session = await requireSession(["DIRETOR"]);
  const estudantes = await prisma.estudante.findMany({
    where: { escolaId: session.escolaId! },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Estudantes</h1>
      <p className="mt-1 text-sm text-slate-500">{estudantes.length} estudante(s) enturmado(s).</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estudantes.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{e.nome}</td>
                <td className="px-4 py-3 text-slate-500">{e.matricula}</td>
                <td className="px-4 py-3 text-slate-500">{e.turmaSerie ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{e.nomeResponsavel ?? "-"}</td>
              </tr>
            ))}
            {estudantes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Nenhum estudante sincronizado para esta escola.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
