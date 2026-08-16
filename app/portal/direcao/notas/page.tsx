import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

export default async function DirecaoNotasPage({
  searchParams,
}: {
  searchParams: { ano?: string };
}) {
  const session = await requireSession(["DIRETOR"]);
  const escolaId = session.escolaId!;
  const ano = Number(searchParams.ano) || new Date().getFullYear();

  const agregados = await prisma.notaEstudante.groupBy({
    by: ["turma", "disciplina"],
    where: { ano, estudante: { escolaId } },
    _avg: { nota: true },
    _count: { _all: true },
  });

  const porTurma = agregados.reduce<Record<string, typeof agregados>>((acc, item) => {
    const turma = item.turma ?? "Sem turma";
    (acc[turma] ??= []).push(item);
    return acc;
  }, {});

  const turmasOrdenadas = Object.keys(porTurma).sort((a, b) => a.localeCompare(b));

  const totalNotas = agregados.reduce((sum, a) => sum + a._count._all, 0);
  const mediaGeral =
    totalNotas > 0
      ? agregados.reduce((sum, a) => sum + (a._avg.nota ?? 0) * a._count._all, 0) / totalNotas
      : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Notas por Turma</h1>
      <p className="mt-1 text-sm text-slate-500">Ano letivo {ano} · média por disciplina em cada turma.</p>

      {mediaGeral !== null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{mediaGeral.toFixed(1)}</div>
            <div className="text-xs text-slate-500">Média geral da escola</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{turmasOrdenadas.length}</div>
            <div className="text-xs text-slate-500">Turmas com notas lançadas</div>
          </div>
        </div>
      )}

      {turmasOrdenadas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhuma nota lançada para o ano {ano} ainda.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {turmasOrdenadas.map((turma) => {
            const itens = [...(porTurma[turma] ?? [])].sort((a, b) => a.disciplina.localeCompare(b.disciplina));
            return (
              <div key={turma} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Link
                  href={`/portal/direcao/turmas/${encodeURIComponent(turma)}`}
                  className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                >
                  {turma}
                </Link>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Disciplina</th>
                      <th className="px-4 py-3">Notas lançadas</th>
                      <th className="px-4 py-3">Média da turma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item) => (
                      <tr key={item.disciplina}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.disciplina}</td>
                        <td className="px-4 py-3 text-slate-500">{item._count._all}</td>
                        <td className="px-4 py-3 text-slate-900">{(item._avg.nota ?? 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
