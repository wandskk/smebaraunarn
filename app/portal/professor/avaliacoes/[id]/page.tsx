import Link from "next/link";
import { notFound } from "next/navigation";
import type { NivelFluencia } from "@prisma/client";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import {
  getAvaliacaoDetalhe,
  getAnaliseItensAvaliacao,
  TIPO_AVALIACAO_LABEL,
  NIVEL_FLUENCIA_LABEL,
  STATUS_AVALIACAO_LABEL,
} from "@/lib/queries/avaliacoes";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Pagination } from "@/components/ui/pagination";
import { RingProgress } from "@/components/ui/charts/ring-progress";
import { ClipboardCheck, Percent, Users } from "lucide-react";

interface PageProps {
  params: { id: string };
  searchParams: { turma?: string; nivel?: string; page?: string; pageSize?: string };
}

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

export default async function ProfessorAvaliacaoDetalhePage({ params, searchParams }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const atribuicoes = servidor.turmas.map((t) => ({ escolaId: t.escolaId, turma: t.turma }));
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  // Escopo restrito às turmas atribuídas ao professor — mesmo se a URL for
  // acessada diretamente, nunca vaza resultado de turma fora da atribuição
  // (a consulta já filtra no banco, não só na UI).
  const resultado = await getAvaliacaoDetalhe(params.id, { kind: "professor", atribuicoes }, {
    turma: searchParams.turma || undefined,
    nivel: (searchParams.nivel as NivelFluencia) || undefined,
    skip,
    take,
  });
  if (!resultado) notFound();
  const { avaliacao, itens, total } = resultado;
  const analise = await getAnaliseItensAvaliacao(params.id, { kind: "professor", atribuicoes });

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/portal/professor/avaliacoes" className="text-primary hover:underline">
            ← Avaliações Municipais
          </Link>
        }
        title={avaliacao.nome}
        description={`${avaliacao.codigo} · ${TIPO_AVALIACAO_LABEL[avaliacao.tipo]} · ${avaliacao.ano}${avaliacao.etapaEnsino ? ` · ${avaliacao.etapaEnsino}` : ""}`}
        actions={<Badge variant={STATUS_BADGE_VARIANT[avaliacao.status]}>{STATUS_AVALIACAO_LABEL[avaliacao.status]}</Badge>}
      />

      <h2 className="mt-8 text-sm font-semibold text-foreground">Cobertura (suas turmas)</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Realizado / Esperado"
          value={`${avaliacao.cobertura.realizado} / ${avaliacao.cobertura.esperado}`}
          icon={ClipboardCheck}
          accent="info"
        />
        <MetricCard
          label="Percentual de cobertura"
          value={
            avaliacao.cobertura.percentual !== null ? (
              <div className="flex items-center gap-2">
                <RingProgress value={avaliacao.cobertura.percentual} accent="education" size={32} strokeWidth={5} valueLabel="" />
                <span>{avaliacao.cobertura.percentual.toFixed(1)}%</span>
              </div>
            ) : (
              "-"
            )
          }
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
                <TableRow key={`${t.escolaId}:${t.turma}`}>
                  <TableCell className="font-medium text-foreground">{t.turma}</TableCell>
                  <TableCell className="text-foreground-muted">{t.matriculados}</TableCell>
                  <TableCell className="text-foreground-muted">{t.resultados}</TableCell>
                  <TableCell>
                    {t.percentual === null ? (
                      <span className="text-foreground-muted/60">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RingProgress value={t.percentual} accent="info" size={32} strokeWidth={4} valueLabel="" />
                        <span className="text-foreground-muted">{t.percentual.toFixed(0)}%</span>
                      </div>
                    )}
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
          <Link href={`/portal/professor/avaliacoes/${params.id}`} className="text-sm text-primary hover:underline">
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
                <TableCell className="text-foreground-muted">{r.turma ?? "-"}</TableCell>
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
        basePath={`/portal/professor/avaliacoes/${params.id}`}
        searchParams={searchParams}
      />

      {analise && analise.totalRespondentes > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-foreground">Análise por questão (suas turmas)</h2>
          <p className="mt-1 text-xs text-foreground-muted/70">
            % de acerto sobre os resultados das suas turmas com resposta por item registrada (
            {analise.totalRespondentes} resultado(s)).
          </p>
          <div className="mt-3">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Nº</TableHeadCell>
                  <TableHeadCell>Descritor</TableHeadCell>
                  <TableHeadCell>Respondidas</TableHeadCell>
                  <TableHeadCell>Acertos</TableHeadCell>
                  <TableHeadCell>% de acerto</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {analise.porQuestao.map((q) => (
                  <TableRow key={q.numero}>
                    <TableCell className="text-foreground">{q.numero}</TableCell>
                    <TableCell className="text-foreground-muted">{q.descritor ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{q.respondidas}</TableCell>
                    <TableCell className="text-foreground-muted">{q.acertos}</TableCell>
                    <TableCell>
                      {q.percentualAcerto === null ? (
                        <span className="text-foreground-muted/60">-</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <RingProgress value={q.percentualAcerto} accent="education" size={32} strokeWidth={4} valueLabel="" />
                          <span className="text-foreground-muted">{q.percentualAcerto.toFixed(0)}%</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        </>
      )}

      <Card className="mt-8">
        <p className="text-xs text-foreground-muted">
          A edição de resultados e a importação de novas avaliações continuam restritas à Secretaria (Admin) — o
          Professor acompanha aplicação e cobertura das suas turmas em modo leitura/diagnóstico.
        </p>
      </Card>
    </div>
  );
}
