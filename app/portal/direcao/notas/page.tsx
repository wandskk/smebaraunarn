import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { BarChart3, BookOpen, Inbox } from "lucide-react";

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
      <PageHeader title="Notas por Turma" description={`Ano letivo ${ano} · média por disciplina em cada turma.`} />

      {mediaGeral !== null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MetricCard label="Média geral da escola" value={mediaGeral.toFixed(1)} icon={BarChart3} accent="education" />
          <MetricCard
            label="Turmas com notas lançadas"
            value={<AnimatedNumber value={turmasOrdenadas.length} />}
            icon={BookOpen}
            accent="education"
          />
        </div>
      )}

      {turmasOrdenadas.length === 0 ? (
        <EmptyState className="mt-8" icon={Inbox} title="Nenhuma nota lançada" description={`Nenhuma nota lançada para o ano ${ano} ainda.`} />
      ) : (
        <div className="mt-6 space-y-8">
          {turmasOrdenadas.map((turma) => {
            const itens = [...(porTurma[turma] ?? [])].sort((a, b) => a.disciplina.localeCompare(b.disciplina));
            return (
              <div key={turma}>
                <Link
                  href={`/portal/direcao/turmas/${encodeURIComponent(turma)}`}
                  className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {turma}
                </Link>
                <div className="mt-3">
                  <DataTable>
                    <TableHeader>
                      <tr>
                        <TableHeadCell>Disciplina</TableHeadCell>
                        <TableHeadCell>Notas lançadas</TableHeadCell>
                        <TableHeadCell>Média da turma</TableHeadCell>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.disciplina}>
                          <TableCell className="font-medium text-foreground">{item.disciplina}</TableCell>
                          <TableCell className="text-foreground-muted">{item._count._all}</TableCell>
                          <TableCell className="text-foreground">{(item._avg.nota ?? 0).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
