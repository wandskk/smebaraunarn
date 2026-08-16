import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";

export default async function FrequenciaPage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const registros = await prisma.frequenciaEstudante.findMany({
    where: { estudanteMatricula: estudante.matricula },
    orderBy: { data: "desc" },
    take: 90,
  });

  const totalAulas = registros.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = registros.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = registros.filter((r) => r.abonada).length;
  const percentualPresenca = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : 100;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Frequência</h1>
      <p className="mt-1 text-sm text-slate-500">Últimos registros de presença e falta.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">{percentualPresenca.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">Frequência no período</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">{totalFaltas}</div>
          <div className="text-xs text-slate-500">Faltas registradas</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">{totalAbonadas}</div>
          <div className="text-xs text-slate-500">Faltas abonadas</div>
        </div>
      </div>

      {registros.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhum registro de frequência encontrado.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">Aulas</th>
                <th className="px-4 py-3">Faltas</th>
                <th className="px-4 py-3">Abonada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {format(new Date(r.data), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.disciplina ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.quantidadeAula}</td>
                  <td className="px-4 py-3 text-slate-600">{r.falta}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.abonada ? `Sim${r.motivoAbono ? ` (${r.motivoAbono})` : ""}` : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
