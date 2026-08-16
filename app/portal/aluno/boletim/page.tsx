import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";

export default async function BoletimPage({
  searchParams,
}: {
  searchParams: { ano?: string };
}) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const ano = Number(searchParams.ano) || new Date().getFullYear();

  const notas = await prisma.notaEstudante.findMany({
    where: { estudanteMatricula: estudante.matricula, ano },
    orderBy: [{ disciplina: "asc" }, { unidade: "asc" }],
  });

  const porDisciplina = notas.reduce<Record<string, typeof notas>>((acc, nota) => {
    (acc[nota.disciplina] ??= []).push(nota);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Boletim Escolar</h1>
          <p className="mt-1 text-sm text-slate-500">Ano letivo {ano}</p>
        </div>
      </div>

      {Object.keys(porDisciplina).length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhuma nota lançada para este ano letivo ainda.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">1ª Un.</th>
                <th className="px-4 py-3">2ª Un.</th>
                <th className="px-4 py-3">3ª Un.</th>
                <th className="px-4 py-3">4ª Un.</th>
                <th className="px-4 py-3">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(porDisciplina).map(([disciplina, unidades]) => {
                const porUnidade = new Map(unidades.map((u) => [u.unidade, u.nota]));
                const media =
                  unidades.reduce((sum, u) => sum + u.nota, 0) / (unidades.length || 1);
                return (
                  <tr key={disciplina}>
                    <td className="px-4 py-3 font-medium text-slate-900">{disciplina}</td>
                    {[1, 2, 3, 4].map((u) => (
                      <td key={u} className="px-4 py-3 text-slate-600">
                        {porUnidade.get(u) ?? "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-slate-900">{media.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
