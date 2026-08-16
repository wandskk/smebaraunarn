import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function DirecaoFrequenciaPage() {
  const session = await requireSession(["DIRETOR"]);
  const escolaId = session.escolaId!;

  const anoAtual = new Date().getFullYear();
  const inicioAno = `${anoAtual}-01-01`;

  const agregados = await prisma.frequenciaEstudante.groupBy({
    by: ["turma"],
    where: { estudante: { escolaId }, data: { gte: inicioAno } },
    _sum: { falta: true, quantidadeAula: true },
  });

  const linhas = agregados
    .map((item) => {
      const totalAulas = item._sum.quantidadeAula ?? 0;
      const totalFaltas = item._sum.falta ?? 0;
      const percentual = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null;
      return { turma: item.turma ?? "Sem turma", totalAulas, totalFaltas, percentual };
    })
    .sort((a, b) => a.turma.localeCompare(b.turma));

  const totalAulasEscola = linhas.reduce((sum, l) => sum + l.totalAulas, 0);
  const totalFaltasEscola = linhas.reduce((sum, l) => sum + l.totalFaltas, 0);
  const percentualEscola =
    totalAulasEscola > 0 ? ((totalAulasEscola - totalFaltasEscola) / totalAulasEscola) * 100 : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Frequência por Turma</h1>
      <p className="mt-1 text-sm text-slate-500">Ano letivo {anoAtual}.</p>

      {percentualEscola !== null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{percentualEscola.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">Frequência geral da escola</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{totalFaltasEscola}</div>
            <div className="text-xs text-slate-500">Faltas registradas</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{linhas.length}</div>
            <div className="text-xs text-slate-500">Turmas com registro</div>
          </div>
        </div>
      )}

      {linhas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhum registro de frequência para {anoAtual} ainda.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Aulas registradas</th>
                <th className="px-4 py-3">Faltas</th>
                <th className="px-4 py-3">Frequência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map((l) => (
                <tr key={l.turma}>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.turma}</td>
                  <td className="px-4 py-3 text-slate-500">{l.totalAulas}</td>
                  <td className="px-4 py-3 text-slate-500">{l.totalFaltas}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {l.percentual !== null ? `${l.percentual.toFixed(1)}%` : "-"}
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
