import { Users } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export default async function ProfessorHomePage() {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const disciplinas = [...new Set(servidor.turmas.map((t) => t.disciplina).filter(Boolean))];

  // P0: sem turma vinculada, o professor não pode ver contagem da escola
  // inteira. Agrupado por (escolaId, turma) da própria atribuição — não só
  // por turma — porque um professor pode ter turmas em mais de uma escola
  // (ETAPA 06); usar apenas servidor.escolaId contaria errado nesse caso.
  const totalAlunos =
    servidor.turmas.length === 0
      ? 0
      : await prisma.estudante.count({
          where: { OR: servidor.turmas.map((t) => ({ escolaId: t.escolaId, turmaSerie: t.turma })) },
        });

  return (
    <div>
      <PageHeader
        title={`Olá, ${servidor.nome.split(" ")[0]}`}
        description={`${servidor.cargo ?? "Professor(a)"} ${disciplinas.length > 0 ? `· ${disciplinas.join(" / ")}` : ""}`}
      />

      {servidor.turmas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          Nenhuma turma vinculada ainda.
        </p>
      ) : (
        <div className="mt-6">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Turma</TableHeadCell>
                <TableHeadCell>Série</TableHeadCell>
                <TableHeadCell>Turno</TableHeadCell>
                <TableHeadCell>Disciplina</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {servidor.turmas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">{t.turma}</TableCell>
                  <TableCell className="text-foreground-muted">{t.serie ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{t.turno ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{t.disciplina ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}

      <div className="mt-6">
        <MetricCard
          href="/portal/professor/turmas"
          label="Ver minhas turmas"
          value={`${totalAlunos} aluno(s)`}
          icon={Users}
          accent="primary"
        />
      </div>
    </div>
  );
}
