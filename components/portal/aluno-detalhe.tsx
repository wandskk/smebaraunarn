import { Inbox } from "lucide-react";
import type { AlunoDetalheCompleto } from "@/lib/queries/academico";
import { calcularPercentualFrequencia } from "@/lib/analytics/frequencia";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { GradeTable } from "@/components/portal/grade-table";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceHeatmap, type AttendanceHeatmapDatum } from "@/components/ui/charts/attendance-heatmap";
import { formatarDataIso } from "@/lib/format-date";

interface AlunoDetalheProps {
  dados: AlunoDetalheCompleto;
  ano: number;
  /**
   * Quando informado, o boletim mostra só as disciplinas listadas — usado
   * pelo Professor (ETAPA 06): por padrão, um professor vê a íntegra das
   * notas do estudante mesmo lecionando só uma disciplina na turma (achado
   * P0 do documento de Professor). Frequência não é filtrada por disciplina
   * aqui — o próprio documento trata isso como visão geral permitida por
   * padrão, diferente de notas.
   */
  disciplinasVisiveis?: string[];
}

export function AlunoDetalhe({ dados, ano, disciplinasVisiveis }: AlunoDetalheProps) {
  const { estudante, frequencias, janelaFrequencia } = dados;
  const notas = disciplinasVisiveis
    ? dados.notas.filter((n) => disciplinasVisiveis.includes(n.disciplina))
    : dados.notas;

  const totalAulas = frequencias.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = frequencias.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = frequencias.filter((r) => r.abonada).length;
  // Reaproveita a mesma fórmula usada por Admin/Diretor/Professor (lib/analytics/frequencia.ts)
  // em vez de uma segunda implementação local — garante o mesmo resultado para a mesma entidade.
  const percentualPresenca = calcularPercentualFrequencia(totalAulas, totalFaltas);
  const periodoFrequenciaLabel = `${formatarDataIso(janelaFrequencia.inicio)} a ${formatarDataIso(janelaFrequencia.fim)}`;

  // Mesmo agrupamento por dia de app/portal/aluno/frequencia/page.tsx —
  // alimenta o heatmap de calendário a partir dos mesmos `frequencias` já
  // carregados, sem query nova.
  const porDia = new Map<string, { aulas: number; faltas: number }>();
  for (const f of frequencias) {
    const atual = porDia.get(f.data) ?? { aulas: 0, faltas: 0 };
    atual.aulas += f.quantidadeAula;
    atual.faltas += f.falta;
    porDia.set(f.data, atual);
  }
  const heatmapDados: Record<string, AttendanceHeatmapDatum> = {};
  for (const [data, v] of porDia.entries()) {
    if (v.aulas === 0) continue;
    const intensidade = v.faltas === 0 ? "boa" : v.faltas >= v.aulas ? "critica" : "atencao";
    heatmapDados[data] = { intensidade, tooltip: `${formatarDataIso(data)} — ${v.faltas} falta(s) de ${v.aulas} aula(s)` };
  }

  return (
    <div>
      <PageHeader
        title={estudante.nome}
        description={`Matrícula ${estudante.matricula} · ${estudante.turmaSerie ?? "Sem turma"} · ${
          estudante.nomeEscola ?? estudante.escola?.nome
        }`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <dt className="text-xs text-foreground-muted">Responsável</dt>
          <dd className="text-sm font-medium text-foreground">{estudante.nomeResponsavel ?? "-"}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Data de nascimento</dt>
          <dd className="text-sm font-medium text-foreground">{estudante.dataNascimento ?? "-"}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Frequência ({periodoFrequenciaLabel})</dt>
          <dd className="text-sm font-medium text-foreground">
            {percentualPresenca !== null ? `${percentualPresenca.toFixed(1)}%` : "Sem dados no período"}
          </dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Faltas / abonadas</dt>
          <dd className="text-sm font-medium text-foreground">
            {totalFaltas} / {totalAbonadas}
          </dd>
        </Card>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Boletim — {ano}</h2>
      {disciplinasVisiveis && (
        <p className="mt-1 text-xs text-foreground-muted/70">
          Mostrando {disciplinasVisiveis.length > 1 ? "suas disciplinas" : "sua disciplina"}:{" "}
          {disciplinasVisiveis.join(", ")}.
        </p>
      )}
      <div className="mt-3">
        <GradeTable notas={notas} emptyMessage={`Nenhuma nota lançada para ${ano} ainda.`} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Frequência — {periodoFrequenciaLabel}</h2>
      {frequencias.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={Inbox}
          title="Sem dados no período"
          description={`Nenhum registro de frequência entre ${periodoFrequenciaLabel}.`}
        />
      ) : (
        <>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-5">
            <AttendanceHeatmap inicio={janelaFrequencia.inicio} fim={janelaFrequencia.fim} dados={heatmapDados} />
          </div>
          <div className="mt-3">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Data</TableHeadCell>
                  <TableHeadCell>Disciplina</TableHeadCell>
                  <TableHeadCell>Situação</TableHeadCell>
                  <TableHeadCell>Abonada</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {frequencias.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-foreground">{formatarDataIso(f.data)}</TableCell>
                    <TableCell className="text-foreground-muted">{f.disciplina ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{f.falta > 0 ? "Falta" : "Presente"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {f.abonada ? `Sim${f.motivoAbono ? ` (${f.motivoAbono})` : ""}` : "Não"}
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
