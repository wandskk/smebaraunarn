import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

const NIVEL_LABEL: Record<string, string> = {
  NAO_LEITOR: "Não leitor",
  LEITOR_DE_SILABAS: "Leitor de sílabas",
  LEITOR_DE_PALAVRAS: "Leitor de palavras",
  LEITOR_DE_FRASES: "Leitor de frases",
  LEITOR_SEM_FLUENCIA: "Leitor sem fluência",
  LEITOR_FLUENTE: "Leitor fluente",
};

export default async function DirecaoAvaliacoesPage() {
  const session = await requireSession(["DIRETOR"]);

  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { escolaId: session.escolaId! },
    include: { avaliacao: true, estudante: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const porAvaliacao = resultados.reduce<Record<string, typeof resultados>>((acc, r) => {
    (acc[r.avaliacao.nome] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Avaliações Municipais" description="Resultados registrados para a sua escola." />

      {Object.keys(porAvaliacao).length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhum resultado de avaliação registrado ainda.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(porAvaliacao).map(([nome, itens]) => (
            <div key={nome}>
              <h2 className="text-sm font-semibold text-foreground">{nome}</h2>
              <div className="mt-3">
                <DataTable>
                  <TableHeader>
                    <tr>
                      <TableHeadCell>Aluno</TableHeadCell>
                      <TableHeadCell>Turma</TableHeadCell>
                      <TableHeadCell>Pontuação</TableHeadCell>
                      <TableHeadCell>Nível</TableHeadCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {itens.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground">{r.estudante.nome}</TableCell>
                        <TableCell className="text-foreground-muted">{r.turma}</TableCell>
                        <TableCell className="text-foreground-muted">{r.pontuacao ?? "-"}</TableCell>
                        <TableCell className="text-foreground-muted">
                          {r.nivelDesempenho ? NIVEL_LABEL[r.nivelDesempenho] : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
