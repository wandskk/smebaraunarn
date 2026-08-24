import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTurmaLabel, getTurmasDaEscola } from "@/lib/queries/academico";
import { getComparativosPorEscola } from "@/lib/queries/comparativos";
import { calcularJanelaComparativaPadrao, resolverDataReferenciaJanela } from "@/lib/queries/frequencia";
import { resolverAnoLetivo } from "@/lib/utils";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { FaixaBadge } from "@/components/admin/faixa-badge";

interface PageProps {
  params: { id: string };
  searchParams: { q?: string; page?: string; pageSize?: string; ano?: string };
}

function formatarPercentual(valor: number | null): string {
  return valor === null ? "-" : `${valor.toFixed(1)}%`;
}

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

/** Mesma leitura de favorabilidade usada em /admin/indicadores/comparativos: distorção inverte o sinal. */
function DiferencaRede({
  diferenca,
  unidade,
  maiorEhMelhor,
}: {
  diferenca: number | null;
  unidade: "p.p." | "pts";
  maiorEhMelhor: boolean;
}) {
  if (diferenca === null) return <span className="text-xs text-foreground-muted/60">sem referência de rede</span>;
  const estavel = Math.abs(diferenca) < 0.05;
  const favoravel = estavel ? null : maiorEhMelhor ? diferenca > 0 : diferenca < 0;
  const texto = `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)} ${unidade} da rede`;
  return <ComparisonDelta diferenca={diferenca} texto={texto} favoravel={favoravel} />;
}

export default async function AdminEscolaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], where: { escolaId }, orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);

  const janela = calcularJanelaComparativaPadrao(resolverDataReferenciaJanela(anoLetivo));
  const { escolas: comparativos } = await getComparativosPorEscola({ anoLetivo, ...janela });
  const comparativo = comparativos.find((c) => c.escolaId === escolaId) ?? null;

  const todasTurmas = await getTurmasDaEscola(escolaId);
  const q = searchParams.q?.trim().toLowerCase();
  const turmasFiltradas = q
    ? todasTurmas.filter(
        (t) => formatTurmaLabel(t.serie, t.turma).toLowerCase().includes(q) || t.turma.toLowerCase().includes(q),
      )
    : todasTurmas;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const turmas = turmasFiltradas.slice(skip, skip + take);

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/admin/escolas" className="text-primary hover:underline">
            ← Escolas
          </Link>
        }
        title={escola.nome}
        description={`Código INEP ${escola.codigoInep ?? "-"}`}
        actions={
          anosDisponiveis.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <Select name="ano" defaultValue={anoLetivo}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    Ano letivo {ano}
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

      <h2 className="mt-6 text-sm font-semibold text-foreground">Comparação com a rede — {anoLetivo}</h2>
      {comparativo ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-xs uppercase text-foreground-muted">Frequência</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-semibold text-foreground">
                {formatarPercentual(comparativo.frequenciaPercentual)}
              </span>
              {comparativo.frequenciaFaixa && <FaixaBadge faixa={comparativo.frequenciaFaixa} />}
            </div>
            <div className="mt-1">
              <DiferencaRede diferenca={comparativo.frequenciaDiferencaRede} unidade="p.p." maiorEhMelhor />
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase text-foreground-muted">Desempenho</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{formatarNota(comparativo.desempenhoMedia)}</div>
            <div className="mt-1">
              <DiferencaRede diferenca={comparativo.desempenhoDiferencaRede} unidade="pts" maiorEhMelhor />
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase text-foreground-muted">Distorção idade-série</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {formatarPercentual(comparativo.distorcaoPercentual)}
            </div>
            <div className="mt-1">
              <DiferencaRede diferenca={comparativo.distorcaoDiferencaRede} unidade="p.p." maiorEhMelhor={false} />
            </div>
          </Card>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          Sem dado suficiente para comparar esta escola com a rede no ano letivo {anoLetivo}.
        </p>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Turmas</h2>
      {todasTurmas.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma turma encontrada para esta escola.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por turma..." />
          {turmas.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
              Nenhuma turma encontrada.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((t) => (
                <Link
                  key={t.turma}
                  href={`/admin/escolas/${escolaId}/turmas/${encodeURIComponent(t.turma)}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-card"
                >
                  <Users className="h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">{formatTurmaLabel(t.serie, t.turma)}</div>
                    <div className="text-xs text-foreground-muted/70">{t.turma}</div>
                    <div className="text-sm text-foreground-muted">{t.totalAlunos} aluno(s)</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPagesFor(turmasFiltradas.length, pageSize)}
            basePath={`/admin/escolas/${escolaId}`}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
