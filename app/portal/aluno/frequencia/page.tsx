import { CalendarCheck, CalendarX, FileCheck, Inbox } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { calcularJanelaDias, calcularPercentualFrequencia } from "@/lib/analytics/frequencia";
import { getStatusSincronizacao } from "@/lib/queries/qualidade-dados";
import { formatarDataIso } from "@/lib/format-date";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceHeatmap, type AttendanceHeatmapDatum } from "@/components/ui/charts/attendance-heatmap";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

const PERIODOS_DIAS = [7, 30, 60, 90] as const;
const PERIODO_PADRAO = 90;

interface PageProps {
  searchParams: { dias?: string };
}

export default async function FrequenciaPage({ searchParams }: PageProps) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const diasSolicitados = Number(searchParams.dias);
  const dias = PERIODOS_DIAS.includes(diasSolicitados as (typeof PERIODOS_DIAS)[number])
    ? diasSolicitados
    : PERIODO_PADRAO;

  const janela = calcularJanelaDias(new Date(), dias);
  const periodoLabel = `${formatarDataIso(janela.inicio)} a ${formatarDataIso(janela.fim)}`;

  const [registros, { modulos }] = await Promise.all([
    prisma.frequenciaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, data: { gte: janela.inicio, lte: janela.fim } },
      orderBy: { data: "desc" },
    }),
    getStatusSincronizacao(),
  ]);
  const freshnessFrequencia = modulos.find((m) => m.modulo === "FREQUENCIA");

  const totalAulas = registros.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = registros.reduce((sum, r) => sum + r.falta, 0);
  // "Faltas abonadas" precisa somar a quantidade de faltas dos registros
  // abonados (campo `falta`), não contar quantos registros têm abonada=true
  // — um registro pode representar mais de uma aula/falta no mesmo dia,
  // então contar linhas subestimaria (ou superestimaria) o total real.
  const totalFaltasAbonadas = registros.filter((r) => r.abonada).reduce((sum, r) => sum + r.falta, 0);
  // Sem aula registrada no período não é "100% de frequência" — é ausência de
  // dado. calcularPercentualFrequencia já retorna null nesse caso (ver
  // lib/analytics/frequencia.ts); renderizado abaixo como "Sem dados no
  // período", nunca como um percentual inventado.
  const percentualPresenca = calcularPercentualFrequencia(totalAulas, totalFaltas);

  // Agrupa por dia (um dia pode ter várias linhas, uma por disciplina) para
  // alimentar o heatmap de calendário e a tendência diária do card acima —
  // mesmos `registros` já buscados, nenhuma query nova.
  const porDia = new Map<string, { aulas: number; faltas: number }>();
  for (const r of registros) {
    const atual = porDia.get(r.data) ?? { aulas: 0, faltas: 0 };
    atual.aulas += r.quantidadeAula;
    atual.faltas += r.falta;
    porDia.set(r.data, atual);
  }
  const diasOrdenados = [...porDia.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  const tendenciaDiaria = diasOrdenados
    .filter(([, v]) => v.aulas > 0)
    .map(([, v]) => calcularPercentualFrequencia(v.aulas, v.faltas) ?? 0);
  const heatmapDados: Record<string, AttendanceHeatmapDatum> = {};
  for (const [data, v] of porDia.entries()) {
    if (v.aulas === 0) continue;
    const intensidade = v.faltas === 0 ? "boa" : v.faltas >= v.aulas ? "critica" : "atencao";
    heatmapDados[data] = { intensidade, tooltip: `${formatarDataIso(data)} — ${v.faltas} falta(s) de ${v.aulas} aula(s)` };
  }

  return (
    <div>
      <PageHeader
        title="Frequência"
        description={`Período: ${periodoLabel}.`}
        metadata={
          freshnessFrequencia && (
            <span className="inline-flex items-center gap-1.5">
              Frequência <DataFreshnessBadge situacao={freshnessFrequencia.situacao} />
            </span>
          )
        }
        actions={
          <form method="get" className="flex items-center gap-2">
            <Select name="dias" defaultValue={dias}>
              {PERIODOS_DIAS.map((d) => (
                <option key={d} value={d}>
                  Últimos {d} dias
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Aplicar
            </Button>
          </form>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Frequência no período"
          value={percentualPresenca !== null ? `${percentualPresenca.toFixed(1)}%` : "Sem dados no período"}
          icon={CalendarCheck}
          accent="attendance"
          trend={tendenciaDiaria.length > 1 ? tendenciaDiaria : undefined}
        />
        <MetricCard
          label="Faltas registradas"
          value={<AnimatedNumber value={totalFaltas} />}
          icon={CalendarX}
          accent="attendance"
        />
        <MetricCard
          label="Faltas abonadas"
          value={<AnimatedNumber value={totalFaltasAbonadas} />}
          icon={FileCheck}
          accent="attendance"
        />
      </div>

      {registros.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Inbox}
          title="Sem dados no período"
          description={`Nenhum registro de frequência entre ${periodoLabel}.`}
        />
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Calendário de presença
            </div>
            <div className="mt-3 overflow-x-auto">
              <AttendanceHeatmap inicio={janela.inicio} fim={janela.fim} dados={heatmapDados} />
            </div>
          </div>
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
                    <TableCell className="text-foreground">{formatarDataIso(r.data)}</TableCell>
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
        </>
      )}
    </div>
  );
}
