import Link from "next/link";
import { notFound } from "next/navigation";
import type { NivelFluencia } from "@prisma/client";
import { requireSession } from "@/lib/require-session";
import { getAvaliacaoDetalhePorEscola, TIPO_AVALIACAO_LABEL, NIVEL_FLUENCIA_LABEL } from "@/lib/queries/avaliacoes";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ClipboardCheck, Percent, Users } from "lucide-react";

interface PageProps {
  params: { id: string };
  searchParams: { turma?: string; nivel?: string; page?: string; pageSize?: string };
}

export default async function DirecaoAvaliacaoDetalhePage({ params, searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const resultado = await getAvaliacaoDetalhePorEscola(params.id, session.escolaId!, {
    turma: searchParams.turma || undefined,
    nivel: (searchParams.nivel as NivelFluencia) || undefined,
    skip,
    take,
  });

  if (!resultado) notFound();
  const { avaliacao, itens, total } = resultado;

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/portal/direcao/avaliacoes" className="text-primary hover:underline">
            ← Avaliações Municipais
          </Link>
        }
        title={avaliacao.nome}
        description={`${avaliacao.codigo} · ${TIPO_AVALIACAO_LABEL[avaliacao.tipo]} · ${avaliacao.ano}${avaliacao.etapaEnsino ? ` · ${avaliacao.etapaEnsino}` : ""}`}
      />

      <h2 className="mt-8 text-sm font-semibold text-foreground">Cobertura</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Realizado / Esperado"
          value={`${avaliacao.cobertura.realizado} / ${avaliacao.cobertura.esperado}`}
          icon={ClipboardCheck}
          accent="info"
        />
        <MetricCard
          label="Percentual de cobertura"
          value={avaliacao.cobertura.percentual !== null ? `${avaliacao.cobertura.percentual.toFixed(1)}%` : "-"}
          icon={Percent}
          accent="education"
        />
        <MetricCard
          label="Turmas completas / com pendência"
          value={`${avaliacao.cobertura.turmasCompletas} / ${avaliacao.cobertura.turmasParciais}`}
          icon={Users}
          accent="attendance"
        />
      </div>
      <p className="mt-2 text-xs text-foreground-muted/70">
        Esperado = estudantes matriculados nas turmas que já têm ao menos um resultado registrado nesta avaliação.
        Turmas da escola sem nenhuma aplicação ainda não entram nesse cálculo — não há, na origem dos dados, uma
        lista de turmas-alvo por avaliação.
      </p>

      {avaliacao.porTurma.length > 0 && (
        <div className="mt-4">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Turma</TableHeadCell>
                <TableHeadCell>Matriculados</TableHeadCell>
                <TableHeadCell>Resultados</TableHeadCell>
                <TableHeadCell>Cobertura</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {avaliacao.porTurma.map((t) => (
                <TableRow key={t.turma}>
                  <TableCell className="font-medium text-foreground">{t.turma}</TableCell>
                  <TableCell className="text-foreground-muted">{t.matriculados}</TableCell>
                  <TableCell className="text-foreground-muted">{t.resultados}</TableCell>
                  <TableCell className="text-foreground-muted">
                    {t.percentual !== null ? `${t.percentual.toFixed(0)}%` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.completa ? "success" : "warning"}>{t.completa ? "Completa" : "Parcial"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Resultados ({total})</h2>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="mb-1 block text-xs text-foreground-muted">Turma</label>
          <Select name="turma" defaultValue={searchParams.turma ?? ""}>
            <option value="">Todas</option>
            {avaliacao.turmasDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Nível</label>
          <Select name="nivel" defaultValue={searchParams.nivel ?? ""}>
            <option value="">Todos</option>
            {Object.entries(NIVEL_FLUENCIA_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(searchParams.turma || searchParams.nivel) && (
          <Link href={`/portal/direcao/avaliacoes/${params.id}`} className="text-sm text-primary hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="mt-4">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Aluno</TableHeadCell>
              <TableHeadCell>Turma</TableHeadCell>
              <TableHeadCell>Pontuação</TableHeadCell>
              <TableHeadCell>Nível</TableHeadCell>
              <TableHeadCell>Palavras/min</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {itens.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-foreground">{r.nomeEstudante}</TableCell>
                <TableCell className="text-foreground-muted">{r.turma}</TableCell>
                <TableCell className="text-foreground-muted">{r.pontuacao ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">
                  {r.nivelDesempenho ? NIVEL_FLUENCIA_LABEL[r.nivelDesempenho] : "-"}
                </TableCell>
                <TableCell className="text-foreground-muted">{r.palavrasPorMin ?? "-"}</TableCell>
              </TableRow>
            ))}
            {itens.length === 0 && <TableEmptyState colSpan={5} title="Nenhum resultado encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath={`/portal/direcao/avaliacoes/${params.id}`}
        searchParams={searchParams}
      />

      <Card className="mt-8">
        <p className="text-xs text-foreground-muted">
          A edição de resultados e a importação de novas avaliações continuam restritas à Secretaria (Admin) — a
          Direção acompanha aplicação e cobertura em modo leitura/diagnóstico.
        </p>
      </Card>
    </div>
  );
}
