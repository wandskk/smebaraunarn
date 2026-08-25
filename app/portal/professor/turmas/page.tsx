import Link from "next/link";
import { Users, Users2 } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { formatTurmaLabel } from "@/lib/queries/academico";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProfessorTurmasPage() {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  // Agrupado por (escolaId, turma) — não só turma — porque a atribuição de
  // cada turma carrega sua própria escola (ETAPA 06); um professor com
  // turmas em mais de uma escola não pode ter a contagem de uma turma
  // atribuída erroneamente à escola de outra.
  const contagens =
    servidor.turmas.length === 0
      ? []
      : await prisma.estudante.groupBy({
          by: ["escolaId", "turmaSerie"],
          where: { OR: servidor.turmas.map((t) => ({ escolaId: t.escolaId, turmaSerie: t.turma })) },
          _count: { _all: true },
        });
  const totalPorTurma = new Map(contagens.map((c) => [`${c.escolaId}:${c.turmaSerie}`, c._count._all]));

  return (
    <div>
      <PageHeader
        title="Minhas Turmas"
        description={
          servidor.turmas.length === 0
            ? "Nenhuma turma vinculada ainda."
            : `${servidor.turmas.length} turma(s) em ${servidor.escolaNome ?? servidor.escola?.nome ?? "sua escola"}.`
        }
      />

      {servidor.turmas.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Users2}
          title="Nenhuma turma vinculada ainda"
          description="Assim que a Secretaria confirmar sua atribuição no SIGEduc, suas turmas aparecerão aqui."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servidor.turmas.map((t, index) => (
            <Link
              key={t.id}
              href={`/portal/professor/turmas/${encodeURIComponent(t.turma)}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-card animate-fade-in-up"
              style={{ "--stagger-delay": `${index * 50}ms` } as React.CSSProperties}
            >
              <Users className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <div className="font-semibold text-foreground">{formatTurmaLabel(t.serie, t.turma)}</div>
                <div className="text-xs text-foreground-muted/70">
                  {t.disciplina ?? "Disciplina não informada"} {t.turno && `· ${t.turno}`}
                </div>
                <div className="mt-1 text-sm text-foreground-muted">
                  {totalPorTurma.get(`${t.escolaId}:${t.turma}`) ?? 0} aluno(s)
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
