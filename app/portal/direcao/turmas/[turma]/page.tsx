import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getTurmaDetalhe } from "@/lib/queries/academico";

interface PageProps {
  params: { turma: string };
}

export default async function DirecaoTurmaDetalhePage({ params }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();
  const detalhe = await getTurmaDetalhe(session.escolaId!, turma, anoAtual);

  return (
    <div>
      <Link href="/portal/direcao/turmas" className="text-sm text-brand-700 hover:underline">
        ← Turmas
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">{turma}</h1>
      <p className="mt-1 text-sm text-slate-500">{detalhe.alunos.length} aluno(s) enturmado(s).</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">
            {detalhe.frequencia.percentual !== null ? `${detalhe.frequencia.percentual.toFixed(1)}%` : "-"}
          </div>
          <div className="text-xs text-slate-500">Frequência da turma</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">{detalhe.frequencia.totalFaltas}</div>
          <div className="text-xs text-slate-500">Faltas registradas</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-2xl font-bold text-slate-900">{detalhe.notasPorDisciplina.length}</div>
          <div className="text-xs text-slate-500">Disciplinas com notas ({anoAtual})</div>
        </div>
      </div>

      {detalhe.notasPorDisciplina.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-slate-900">Médias por disciplina</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Disciplina</th>
                  <th className="px-4 py-3">Notas lançadas</th>
                  <th className="px-4 py-3">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalhe.notasPorDisciplina.map((n) => (
                  <tr key={n.disciplina}>
                    <td className="px-4 py-3 font-medium text-slate-900">{n.disciplina}</td>
                    <td className="px-4 py-3 text-slate-500">{n.quantidade}</td>
                    <td className="px-4 py-3 text-slate-900">{n.media.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Alunos</h2>
      {detalhe.alunos.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Nenhum aluno enturmado nesta turma.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalhe.alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{aluno.nome}</td>
                  <td className="px-4 py-3 text-slate-500">{aluno.matricula}</td>
                  <td className="px-4 py-3 text-slate-500">{aluno.nomeResponsavel ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/portal/direcao/alunos/${aluno.id}`} className="text-brand-700 hover:underline">
                      Ver detalhes
                    </Link>
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
