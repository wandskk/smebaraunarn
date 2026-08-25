import Link from "next/link";
import { CalendarCheck, CalendarX, LayoutGrid, Inbox } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { calcularPercentualFrequencia } from "@/lib/analytics/frequencia";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export default async function DirecaoFrequenciaPage() {
  const session = await requireSession(["DIRETOR"]);
  const escolaId = session.escolaId!;

  const anoAtual = new Date().getFullYear();
  const inicioAno = `${anoAtual}-01-01`;

  const agregados = await prisma.frequenciaEstudante.groupBy({
    by: ["turma"],
    where: { estudante: { escolaId }, data: { gte: inicioAno } },
    _sum: { falta: true, quantidadeAula: true },
  });

  const linhas = agregados
    .map((item) => {
      const totalAulas = item._sum.quantidadeAula ?? 0;
      const totalFaltas = item._sum.falta ?? 0;
      const percentual = calcularPercentualFrequencia(totalAulas, totalFaltas);
      return { turma: item.turma ?? "Sem turma", totalAulas, totalFaltas, percentual };
    })
    .sort((a, b) => a.turma.localeCompare(b.turma));

  const totalAulasEscola = linhas.reduce((sum, l) => sum + l.totalAulas, 0);
  const totalFaltasEscola = linhas.reduce((sum, l) => sum + l.totalFaltas, 0);
  const percentualEscola = calcularPercentualFrequencia(totalAulasEscola, totalFaltasEscola);

  return (
    <div>
      <PageHeader title="Frequência por Turma" description={`Ano letivo ${anoAtual}.`} />

      {percentualEscola !== null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Frequência geral da escola"
            value={`${percentualEscola.toFixed(1)}%`}
            icon={CalendarCheck}
            accent="attendance"
          />
          <MetricCard
            label="Faltas registradas"
            value={<AnimatedNumber value={totalFaltasEscola} />}
            icon={CalendarX}
            accent="attendance"
          />
          <MetricCard
            label="Turmas com registro"
            value={<AnimatedNumber value={linhas.length} />}
            icon={LayoutGrid}
            accent="attendance"
          />
        </div>
      )}

      {linhas.length === 0 ? (
        <EmptyState className="mt-8" icon={Inbox} title="Nenhum registro de frequência" description={`Nenhum registro para ${anoAtual} ainda.`} />
      ) : (
        <div className="mt-6">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Turma</TableHeadCell>
                <TableHeadCell>Aulas registradas</TableHeadCell>
                <TableHeadCell>Faltas</TableHeadCell>
                <TableHeadCell>Frequência</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.turma}>
                  <TableCell className="font-medium text-foreground">
                    <Link
                      href={`/portal/direcao/turmas/${encodeURIComponent(l.turma)}`}
                      className="hover:text-primary hover:underline"
                    >
                      {l.turma}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground-muted">{l.totalAulas}</TableCell>
                  <TableCell className="text-foreground-muted">{l.totalFaltas}</TableCell>
                  <TableCell>
                    {l.percentual === null ? (
                      <span className="text-foreground-muted/60">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RingProgress value={l.percentual} accent="attendance" size={36} strokeWidth={5} valueLabel="" />
                        <span className="text-foreground">{l.percentual.toFixed(1)}%</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}
    </div>
  );
}
