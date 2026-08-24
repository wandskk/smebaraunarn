import Link from "next/link";
import { CalendarCheck, CalendarX, LayoutGrid } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
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
      const percentual = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null;
      return { turma: item.turma ?? "Sem turma", totalAulas, totalFaltas, percentual };
    })
    .sort((a, b) => a.turma.localeCompare(b.turma));

  const totalAulasEscola = linhas.reduce((sum, l) => sum + l.totalAulas, 0);
  const totalFaltasEscola = linhas.reduce((sum, l) => sum + l.totalFaltas, 0);
  const percentualEscola =
    totalAulasEscola > 0 ? ((totalAulasEscola - totalFaltasEscola) / totalAulasEscola) * 100 : null;

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
          <MetricCard label="Faltas registradas" value={String(totalFaltasEscola)} icon={CalendarX} accent="attendance" />
          <MetricCard label="Turmas com registro" value={String(linhas.length)} icon={LayoutGrid} accent="attendance" />
        </div>
      )}

      {linhas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhum registro de frequência para {anoAtual} ainda.
        </p>
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
                  <TableCell className="text-foreground">
                    {l.percentual !== null ? `${l.percentual.toFixed(1)}%` : "-"}
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
