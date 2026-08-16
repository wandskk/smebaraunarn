import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: { id: string };
}

export default async function AlunoDetailPage({ params }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const alunoId = Number(params.id);
  const aluno = await prisma.estudante.findUnique({ where: { id: alunoId } });

  // Escopo travado: professor só pode ver alunos da própria escola e turma
  // (mesma regra de filtro usada na listagem em turma/page.tsx).
  const turmaPermitida = !servidor.turma || aluno?.turmaSerie === servidor.turma;
  if (!aluno || aluno.escolaId !== servidor.escolaId || !turmaPermitida) notFound();

  const [notas, frequencias] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { estudanteMatricula: aluno.matricula },
      orderBy: [{ ano: "desc" }, { disciplina: "asc" }, { unidade: "asc" }],
      take: 40,
    }),
    prisma.frequenciaEstudante.findMany({
      where: { estudanteMatricula: aluno.matricula },
      orderBy: { data: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{aluno.nome}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Matrícula {aluno.matricula} · {aluno.turmaSerie ?? "-"}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Notas
          </div>
          {notas.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Sem notas lançadas.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {notas.map((n) => (
                  <tr key={n.id}>
                    <td className="px-4 py-2 text-slate-900">{n.disciplina}</td>
                    <td className="px-4 py-2 text-slate-500">{n.unidade}ª un.</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">{n.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Frequência recente
          </div>
          {frequencias.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Sem registros de frequência.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {frequencias.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2 text-slate-900">{f.data}</td>
                    <td className="px-4 py-2 text-slate-500">{f.disciplina ?? "-"}</td>
                    <td className="px-4 py-2 text-right text-slate-900">
                      {f.falta > 0 ? "Falta" : "Presente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
