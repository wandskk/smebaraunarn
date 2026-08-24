import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export default async function BoletimPage({
  searchParams,
}: {
  searchParams: { ano?: string };
}) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const ano = Number(searchParams.ano) || new Date().getFullYear();

  const notas = await prisma.notaEstudante.findMany({
    where: { estudanteMatricula: estudante.matricula, ano },
    orderBy: [{ disciplina: "asc" }, { unidade: "asc" }],
  });

  const porDisciplina = notas.reduce<Record<string, typeof notas>>((acc, nota) => {
    (acc[nota.disciplina] ??= []).push(nota);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Boletim Escolar" description={`Ano letivo ${ano}`} />

      {Object.keys(porDisciplina).length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma nota lançada para este ano letivo ainda.
        </p>
      ) : (
        <div className="mt-6">
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
                const media =
                  unidades.reduce((sum, u) => sum + u.nota, 0) / (unidades.length || 1);
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
    </div>
  );
}
