import type { AlunoDetalheCompleto } from "@/lib/queries/academico";
import { calcularPercentualFrequencia } from "@/lib/analytics/frequencia";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { GradeTable } from "@/components/portal/grade-table";
import { formatarDataIso } from "@/lib/format-date";

interface AlunoDetalheProps {
  dados: AlunoDetalheCompleto;
  ano: number;
}

export function AlunoDetalhe({ dados, ano }: AlunoDetalheProps) {
  const { estudante, notas, frequencias, janelaFrequencia } = dados;

  const totalAulas = frequencias.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = frequencias.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = frequencias.filter((r) => r.abonada).length;
  // Reaproveita a mesma fórmula usada por Admin/Diretor/Professor (lib/analytics/frequencia.ts)
  // em vez de uma segunda implementação local — garante o mesmo resultado para a mesma entidade.
  const percentualPresenca = calcularPercentualFrequencia(totalAulas, totalFaltas);
  const periodoFrequenciaLabel = `${formatarDataIso(janelaFrequencia.inicio)} a ${formatarDataIso(janelaFrequencia.fim)}`;

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
      <div className="mt-3">
        <GradeTable notas={notas} emptyMessage={`Nenhuma nota lançada para ${ano} ainda.`} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">Frequência — {periodoFrequenciaLabel}</h2>
      {frequencias.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Sem dados no período — nenhum registro de frequência entre {periodoFrequenciaLabel}.
        </p>
      ) : (
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
      )}
    </div>
  );
}
