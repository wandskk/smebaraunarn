import Link from "next/link";
import { Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";

export default async function ProfessorHomePage() {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const totalAlunos = await prisma.estudante.count({
    where: {
      escolaId: servidor.escolaId ?? -1,
      ...(servidor.turma ? { turmaSerie: servidor.turma } : {}),
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Olá, {servidor.nome.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {servidor.cargo ?? "Professor(a)"} {servidor.disciplina ? `· ${servidor.disciplina}` : ""}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Turma</dt>
          <dd className="text-lg font-semibold text-slate-900">{servidor.turma ?? "-"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Série</dt>
          <dd className="text-lg font-semibold text-slate-900">{servidor.serie ?? "-"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Turno</dt>
          <dd className="text-lg font-semibold text-slate-900">{servidor.turno ?? "-"}</dd>
        </div>
      </div>

      <Link
        href="/portal/professor/turma"
        className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
      >
        <Users className="h-6 w-6 text-brand-600" />
        <div>
          <div className="font-semibold text-slate-900">{totalAlunos} aluno(s) na turma</div>
          <div className="text-sm text-slate-500">Ver lista de estudantes e acompanhamento</div>
        </div>
      </Link>
    </div>
  );
}
