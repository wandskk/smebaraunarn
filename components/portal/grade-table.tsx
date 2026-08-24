import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export interface NotaLancada {
  disciplina: string;
  unidade: number;
  nota: number;
}

export interface GradeTableProps {
  notas: NotaLancada[];
  /** Mensagem do estado vazio — cada perfil frasea de forma um pouco diferente ("para {ano}" vs "para este ano letivo"). */
  emptyMessage: string;
}

/**
 * Tabela de boletim (disciplina × 1ª–4ª unidade × média), compartilhada
 * entre o portal do Aluno (`/portal/aluno/boletim`) e a ficha do estudante
 * (`components/portal/aluno-detalhe.tsx`, usada por Admin/Direção/Professor)
 * — antes da ETAPA 03 as duas telas recalculavam a mesma média
 * separadamente. Não controla espaçamento externo (margem fica a cargo de
 * quem chama, já que cada tela posiciona a tabela de forma diferente).
 */
export function GradeTable({ notas, emptyMessage }: GradeTableProps) {
  const porDisciplina = notas.reduce<Record<string, NotaLancada[]>>((acc, nota) => {
    (acc[nota.disciplina] ??= []).push(nota);
    return acc;
  }, {});

  if (Object.keys(porDisciplina).length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
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
  );
}
