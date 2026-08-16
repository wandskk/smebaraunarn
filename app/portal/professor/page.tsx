import Link from "next/link";
import { Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";

export default async function ProfessorHomePage() {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const nomesTurma = servidor.turmas.map((t) => t.turma);
  const disciplinas = [...new Set(servidor.turmas.map((t) => t.disciplina).filter(Boolean))];

  const totalAlunos = await prisma.estudante.count({
    where: {
      escolaId: servidor.escolaId ?? -1,
      ...(nomesTurma.length > 0 ? { turmaSerie: { in: nomesTurma } } : {}),
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Olá, {servidor.nome.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {servidor.cargo ?? "Professor(a)"} {disciplinas.length > 0 ? `· ${disciplinas.join(" / ")}` : ""}
      </p>

      {servidor.turmas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Nenhuma turma vinculada ainda.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Série</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3">Disciplina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {servidor.turmas.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{t.turma}</td>
                  <td className="px-4 py-3 text-slate-500">{t.serie ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{t.turno ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{t.disciplina ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/portal/professor/turma"
        className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
      >
        <Users className="h-6 w-6 text-brand-600" />
        <div>
          <div className="font-semibold text-slate-900">{totalAlunos} aluno(s) no total</div>
          <div className="text-sm text-slate-500">Ver lista de estudantes e acompanhamento</div>
        </div>
      </Link>
    </div>
  );
}
