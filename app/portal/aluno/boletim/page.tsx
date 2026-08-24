import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { GradeTable } from "@/components/portal/grade-table";

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

  return (
    <div>
      <PageHeader title="Boletim Escolar" description={`Ano letivo ${ano}`} />

      <div className="mt-8">
        <GradeTable notas={notas} emptyMessage="Nenhuma nota lançada para este ano letivo ainda." />
      </div>
    </div>
  );
}
