import Link from "next/link";
import { Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { formatTurmaLabel, getTurmasDaEscola } from "@/lib/queries/academico";

export default async function DirecaoTurmasPage() {
  const session = await requireSession(["DIRETOR"]);
  const turmas = await getTurmasDaEscola(session.escolaId!);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Turmas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Selecione uma turma para ver alunos, notas e frequência.
      </p>

      {turmas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => (
            <Link
              key={t.turma}
              href={`/portal/direcao/turmas/${encodeURIComponent(t.turma)}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
            >
              <Users className="h-6 w-6 shrink-0 text-brand-600" />
              <div>
                <div className="font-semibold text-slate-900">{formatTurmaLabel(t.serie, t.turma)}</div>
                <div className="text-xs text-slate-400">{t.turma}</div>
                <div className="text-sm text-slate-500">{t.totalAlunos} aluno(s)</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
