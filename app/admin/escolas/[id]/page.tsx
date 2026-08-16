import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTurmasDaEscola } from "@/lib/queries/academico";

interface PageProps {
  params: { id: string };
}

export default async function AdminEscolaDetalhePage({ params }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const turmas = await getTurmasDaEscola(escolaId);

  return (
    <div>
      <Link href="/admin/escolas" className="text-sm text-brand-700 hover:underline">
        ← Escolas
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">{escola.nome}</h1>
      <p className="mt-1 text-sm text-slate-500">Código INEP {escola.codigoInep ?? "-"}</p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">Turmas</h2>
      {turmas.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => (
            <Link
              key={t.turma}
              href={`/admin/escolas/${escolaId}/turmas/${encodeURIComponent(t.turma)}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
            >
              <Users className="h-6 w-6 shrink-0 text-brand-600" />
              <div>
                <div className="font-semibold text-slate-900">{t.turma}</div>
                <div className="text-sm text-slate-500">{t.totalAlunos} aluno(s)</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
