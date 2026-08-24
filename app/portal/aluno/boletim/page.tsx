import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { getStatusSincronizacao } from "@/lib/queries/qualidade-dados";
import { resolverAnoLetivo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { GradeTable } from "@/components/portal/grade-table";

interface PageProps {
  searchParams: { ano?: string };
}

export default async function BoletimPage({ searchParams }: PageProps) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const anosRows = await prisma.notaEstudante.groupBy({
    by: ["ano"],
    where: { estudanteMatricula: estudante.matricula },
    orderBy: { ano: "desc" },
  });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const ano = resolverAnoLetivo(searchParams, anosDisponiveis);

  const [notas, { modulos }] = await Promise.all([
    prisma.notaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, ano },
      orderBy: [{ disciplina: "asc" }, { unidade: "asc" }],
    }),
    getStatusSincronizacao(),
  ]);
  const freshnessNotas = modulos.find((m) => m.modulo === "NOTAS");

  const disciplinas = new Set(notas.map((n) => n.disciplina));
  const disciplinasComPendencia = [...disciplinas].filter(
    (d) => notas.filter((n) => n.disciplina === d).length < 4,
  );

  return (
    <div>
      <PageHeader
        title="Boletim Escolar"
        description={`Ano letivo ${ano}.`}
        metadata={
          freshnessNotas && (
            <span className="inline-flex items-center gap-1.5">
              Notas <DataFreshnessBadge situacao={freshnessNotas.situacao} />
            </span>
          )
        }
        actions={
          anosDisponiveis.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <Select name="ano" defaultValue={ano}>
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    Ano letivo {a}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Aplicar
              </Button>
            </form>
          )
        }
      />

      {disciplinasComPendencia.length > 0 && (
        <p className="mt-3 text-sm text-foreground-muted">
          A média de {disciplinasComPendencia.length === 1 ? "1 disciplina ainda é parcial" : `${disciplinasComPendencia.length} disciplinas ainda são parciais`} — faltam unidades a lançar.
          As médias abaixo consideram só as unidades já lançadas, não o ano fechado.
        </p>
      )}

      <div className="mt-6">
        <GradeTable notas={notas} emptyMessage="Nenhuma nota lançada para este ano letivo ainda." mostrarCompletude />
      </div>
    </div>
  );
}
