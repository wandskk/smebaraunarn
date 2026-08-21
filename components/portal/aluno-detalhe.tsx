import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AlunoDetalheCompleto } from "@/lib/queries/academico";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface AlunoDetalheProps {
  dados: AlunoDetalheCompleto;
  ano: number;
}

export function AlunoDetalhe({ dados, ano }: AlunoDetalheProps) {
  const { estudante, notas, frequencias } = dados;

  const porDisciplina = notas.reduce<Record<string, typeof notas>>((acc, nota) => {
    (acc[nota.disciplina] ??= []).push(nota);
    return acc;
  }, {});

  const totalAulas = frequencias.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = frequencias.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = frequencias.filter((r) => r.abonada).length;
  const percentualPresenca = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null;

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
          <dt className="text-xs text-foreground-muted">Frequência ({frequencias.length} registro(s))</dt>
          <dd className="text-sm font-medium text-foreground">
            {percentualPresenca !== null ? `${percentualPresenca.toFixed(1)}%` : "-"}
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
      {Object.keys(porDisciplina).length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Nenhuma nota lançada para {ano} ainda.
        </p>
      ) : (
        <div className="mt-3">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Disciplina</TableHeadCell>
                <TableHeadCell>1ª Un.</TableHeadCell>
                <TableHeadCell>2ª Un.</TableHeadCell>
                <TableHeadCell>3ª Un.</TableHeadCell>
                <TableHeadCell>4ª Un.</TableHeadCell>
                <TableHeadCell>Média</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {Object.entries(porDisciplina).map(([disciplina, unidades]) => {
                const porUnidade = new Map(unidades.map((u) => [u.unidade, u.nota]));
                const media = unidades.reduce((sum, u) => sum + u.nota, 0) / (unidades.length || 1);
                return (
                  <TableRow key={disciplina}>
                    <TableCell className="font-medium text-foreground">{disciplina}</TableCell>
                    {[1, 2, 3, 4].map((u) => (
                      <TableCell key={u} className="text-foreground-muted">
                        {porUnidade.get(u) ?? "-"}
                      </TableCell>
                    ))}
                    <TableCell className="font-semibold text-foreground">{media.toFixed(1)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Frequência recente</h2>
      {frequencias.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Nenhum registro de frequência encontrado.
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
                  <TableCell className="text-foreground">
                    {format(new Date(f.data), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
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
