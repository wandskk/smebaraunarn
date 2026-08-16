import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTurmaLabel, getTurmaDetalhe } from "@/lib/queries/academico";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

interface PageProps {
  params: { id: string; turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminTurmaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();
  const detalhe = await getTurmaDetalhe(escolaId, turma, anoAtual);

  const q = searchParams.q?.trim().toLowerCase();
  const alunosFiltrados = q
    ? detalhe.alunos.filter(
        (a) => a.nome.toLowerCase().includes(q) || a.matricula.toLowerCase().includes(q),
      )
    : detalhe.alunos;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const alunosPagina = alunosFiltrados.slice(skip, skip + take);

  return (
    <div>
      <Link href={`/admin/escolas/${escolaId}`} className="text-sm text-brand-700 hover:underline">
        ← {escola.nome}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">{formatTurmaLabel(detalhe.serie, turma)}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {detalhe.serie && <span className="text-slate-400">{turma} · </span>}
        {detalhe.alunos.length} aluno(s) enturmado(s).
      </p>

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
        <>
          <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />
          {alunosPagina.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              Nenhum aluno encontrado.
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
                  {alunosPagina.map((aluno) => (
                    <tr key={aluno.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{aluno.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{aluno.matricula}</td>
                      <td className="px-4 py-3 text-slate-500">{aluno.nomeResponsavel ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/estudantes/${aluno.id}`} className="text-brand-700 hover:underline">
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPagesFor(alunosFiltrados.length, pageSize)}
            basePath={`/admin/escolas/${escolaId}/turmas/${params.turma}`}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
