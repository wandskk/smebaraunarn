import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, CalendarX, FileCheck } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export default async function FrequenciaPage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const registros = await prisma.frequenciaEstudante.findMany({
    where: { estudanteMatricula: estudante.matricula },
    orderBy: { data: "desc" },
    take: 90,
  });

  const totalAulas = registros.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = registros.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = registros.filter((r) => r.abonada).length;
  const percentualPresenca = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : 100;

  return (
    <div>
      <PageHeader title="Frequência" description="Últimos registros de presença e falta." />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Frequência no período"
          value={`${percentualPresenca.toFixed(1)}%`}
          icon={CalendarCheck}
          accent="attendance"
        />
        <MetricCard label="Faltas registradas" value={String(totalFaltas)} icon={CalendarX} accent="attendance" />
        <MetricCard label="Faltas abonadas" value={String(totalAbonadas)} icon={FileCheck} accent="attendance" />
      </div>

      {registros.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhum registro de frequência encontrado.
        </p>
      ) : (
        <div className="mt-6">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Data</TableHeadCell>
                <TableHeadCell>Disciplina</TableHeadCell>
                <TableHeadCell>Aulas</TableHeadCell>
                <TableHeadCell>Faltas</TableHeadCell>
                <TableHeadCell>Abonada</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {registros.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-foreground">
                    {format(new Date(r.data), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-foreground-muted">{r.disciplina ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{r.quantidadeAula}</TableCell>
                  <TableCell className="text-foreground-muted">{r.falta}</TableCell>
                  <TableCell className="text-foreground-muted">
                    {r.abonada ? `Sim${r.motivoAbono ? ` (${r.motivoAbono})` : ""}` : "Não"}
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
