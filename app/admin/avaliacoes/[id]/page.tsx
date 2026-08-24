import Link from "next/link";
import { notFound } from "next/navigation";
import type { NivelFluencia } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NIVEL_FLUENCIA_LABEL as NIVEL_LABEL,
  TIPO_AVALIACAO_LABEL,
  STATUS_AVALIACAO_LABEL,
  getAvaliacaoDetalhe,
  getAnaliseItensAvaliacao,
} from "@/lib/queries/avaliacoes";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { QuestaoForm } from "./questao-form";
import { ResultadoForm } from "./resultado-form";
import { ImportarQuestoesForm } from "./importar-questoes-form";
import { ImportarResultadosForm } from "./importar-resultados-form";
import { DeleteRowButton } from "./row-actions";
import { deleteQuestaoAction, deleteResultadoAction, deleteAvaliacaoAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { ClipboardCheck, Pencil, Percent, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { id: string };
  searchParams: {
    tab?: string;
    turma?: string;
    nivel?: string;
    page?: string;
    pageSize?: string;
    editarQuestao?: string;
  };
}

const TABS = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "questoes", label: "Questões" },
  { id: "resultados", label: "Resultados" },
  { id: "analise", label: "Análise" },
  { id: "importar", label: "Importar" },
] as const;

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

export default async function AvaliacaoDetailPage({ params, searchParams }: PageProps) {
  const tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as (typeof TABS)[number]["id"]) : "visao-geral";
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const [avaliacaoBase, detalhe] = await Promise.all([
    prisma.avaliacao.findUnique({
      where: { id: params.id },
      include: { questoes: { orderBy: { numero: "asc" } } },
    }),
    getAvaliacaoDetalhe(params.id, { kind: "rede" }, {
      turma: searchParams.turma || undefined,
      nivel: (searchParams.nivel as NivelFluencia) || undefined,
      skip,
      take,
    }),
  ]);
  if (!avaliacaoBase || !detalhe) notFound();
  const { avaliacao, itens, total } = detalhe;

  const analise = tab === "analise" && avaliacaoBase.questoes.length > 0
    ? await getAnaliseItensAvaliacao(params.id, { kind: "rede" })
    : null;

  const questaoEmEdicao = searchParams.editarQuestao
    ? avaliacaoBase.questoes.find((q) => q.id === searchParams.editarQuestao)
    : undefined;

  function tabHref(tabId: string) {
    return `/admin/avaliacoes/${params.id}?tab=${tabId}`;
  }

  return (
    <div>
      <PageHeader
        title={avaliacaoBase.nome}
        description={`${avaliacaoBase.codigo} · ${TIPO_AVALIACAO_LABEL[avaliacaoBase.tipo]} · ${avaliacaoBase.ano} · ${avaliacaoBase.etapaEnsino ?? "Etapa não informada"}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_BADGE_VARIANT[avaliacao.status]}>{STATUS_AVALIACAO_LABEL[avaliacao.status]}</Badge>
            <form action={deleteAvaliacaoAction.bind(null, avaliacaoBase.id)}>
              <button type="submit" className="text-sm text-danger hover:underline">
                Excluir avaliação
              </button>
            </form>
          </div>
        }
      />

      <nav className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground-muted hover:text-foreground",
            )}
          >
            {t.label}
            {t.id === "questoes" && ` (${avaliacaoBase.questoes.length})`}
            {t.id === "resultados" && ` (${avaliacao.cobertura.realizado})`}
          </Link>
        ))}
      </nav>

      {tab === "visao-geral" && (
        <div className="mt-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Realizado / Esperado (rede)"
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
          <p className="text-xs text-foreground-muted/70">
            Esperado = estudantes matriculados nas turmas (de qualquer escola da rede) que já têm ao menos um
            resultado registrado nesta avaliação. Turmas sem nenhuma aplicação ainda não entram nesse cálculo — não
            há, na origem dos dados, uma lista de turmas-alvo por avaliação. Status é derivado da cobertura, não é um
            campo cadastrado.
          </p>

          {avaliacao.escolasPendentes && avaliacao.escolasPendentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Escolas sem nenhum resultado ({avaliacao.escolasPendentes.length})
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {avaliacao.escolasPendentes.map((e) => (
                  <Link key={e.id} href={`/admin/escolas/${e.id}`}>
                    <Badge variant="warning">{e.nome}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {avaliacao.porTurma.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Cobertura por turma</h2>
              <div className="mt-3">
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
            </div>
          )}
        </div>
      )}

      {tab === "questoes" && (
        <div className="mt-6">
          <SectionCard title={questaoEmEdicao ? `Editar questão ${questaoEmEdicao.numero}` : "Adicionar questão"}>
            <QuestaoForm
              avaliacaoId={avaliacaoBase.id}
              questao={questaoEmEdicao}
              cancelHref={questaoEmEdicao ? tabHref("questoes") : undefined}
            />
          </SectionCard>
          {avaliacaoBase.questoes.length > 0 && (
            <div className="mt-4">
              <DataTable>
                <TableHeader>
                  <tr>
                    <TableHeadCell>Nº</TableHeadCell>
                    <TableHeadCell>Descritor</TableHeadCell>
                    <TableHeadCell>Gabarito</TableHeadCell>
                    <TableHeadCell>Peso</TableHeadCell>
                    <TableHeadCell className="text-right">Ações</TableHeadCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {avaliacaoBase.questoes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-foreground">{q.numero}</TableCell>
                      <TableCell className="text-foreground-muted">{q.descritor ?? "-"}</TableCell>
                      <TableCell className="text-foreground-muted">{q.gabaritoCorreto ?? "-"}</TableCell>
                      <TableCell className="text-foreground-muted">{q.peso}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-3">
                          <Link
                            href={`${tabHref("questoes")}&editarQuestao=${q.id}`}
                            className="text-foreground-muted hover:text-primary"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <DeleteRowButton onDelete={deleteQuestaoAction.bind(null, avaliacaoBase.id, q.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          )}
        </div>
      )}

      {tab === "resultados" && (
        <div className="mt-6">
          <SectionCard title="Registrar resultado">
            <ResultadoForm
              avaliacaoId={avaliacaoBase.id}
              questoes={avaliacaoBase.questoes.map((q) => ({ numero: q.numero, descritor: q.descritor }))}
            />
          </SectionCard>

          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="resultados" />
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
                {Object.entries(NIVEL_LABEL).map(([valor, rotulo]) => (
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
              <Link href={tabHref("resultados")} className="text-sm text-primary hover:underline">
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
                  <TableHeadCell className="text-right">Ações</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {itens.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">{r.nomeEstudante}</TableCell>
                    <TableCell className="text-foreground-muted">{r.turma}</TableCell>
                    <TableCell className="text-foreground-muted">{r.pontuacao ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {r.nivelDesempenho ? NIVEL_LABEL[r.nivelDesempenho] : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteRowButton onDelete={deleteResultadoAction.bind(null, avaliacaoBase.id, r.id)} />
                    </TableCell>
                  </TableRow>
                ))}
                {itens.length === 0 && <TableEmptyState colSpan={5} title="Nenhum resultado encontrado." />}
              </TableBody>
            </DataTable>
          </div>

          <Pagination
            page={page}
            totalPages={totalPagesFor(total, pageSize)}
            basePath={`/admin/avaliacoes/${params.id}`}
            searchParams={{ ...searchParams, tab: "resultados" }}
          />
          <p className="mt-2 text-xs text-foreground-muted/70">
            Para editar um resultado, registre novamente com a mesma matrícula/CPF — os dados são atualizados em vez
            de duplicados.
          </p>
        </div>
      )}

      {tab === "analise" && (
        <div className="mt-6 space-y-8">
          {avaliacaoBase.questoes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
              Cadastre questões (aba Questões) para habilitar a análise por item/descritor.
            </p>
          ) : !analise || analise.totalRespondentes === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
              Nenhum resultado com resposta por item registrada ainda. Ao lançar um resultado na aba Resultados,
              preencha a resposta de cada questão para alimentar esta análise.
            </p>
          ) : (
            <>
              <p className="text-xs text-foreground-muted/70">
                % de acerto calculado sobre os resultados que informaram resposta para cada questão (
                {analise.totalRespondentes} resultado(s) com ao menos uma resposta registrada). Questões sem gabarito
                cadastrado não entram no cálculo.
              </p>

              <div>
                <h2 className="text-sm font-semibold text-foreground">Por questão</h2>
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
                          <TableCell className="text-foreground-muted">
                            {q.percentualAcerto !== null ? `${q.percentualAcerto.toFixed(0)}%` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              </div>

              {analise.porDescritor.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Por descritor</h2>
                  <div className="mt-3">
                    <DataTable>
                      <TableHeader>
                        <tr>
                          <TableHeadCell>Descritor</TableHeadCell>
                          <TableHeadCell>Respondidas</TableHeadCell>
                          <TableHeadCell>Acertos</TableHeadCell>
                          <TableHeadCell>% de acerto</TableHeadCell>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {analise.porDescritor.map((d) => (
                          <TableRow key={d.descritor}>
                            <TableCell className="font-medium text-foreground">{d.descritor}</TableCell>
                            <TableCell className="text-foreground-muted">{d.respondidas}</TableCell>
                            <TableCell className="text-foreground-muted">{d.acertos}</TableCell>
                            <TableCell className="text-foreground-muted">
                              {d.percentualAcerto !== null ? `${d.percentualAcerto.toFixed(0)}%` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </DataTable>
                  </div>
                  <p className="mt-2 text-xs text-foreground-muted/70">
                    Descritor é o texto livre cadastrado em cada questão — ainda não existe um catálogo estruturado de
                    habilidades/BNCC na base; agrupar por esse texto já prepara a estrutura para quando houver uma
                    fonte validada, sem inventar uma taxonomia agora.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "importar" && (
        <div className="mt-6 space-y-10">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Importar questões</h2>
            <p className="mt-1 text-xs text-foreground-muted/70">
              Cadastra questões (gabarito) em lote — o mesmo resultado de usar o formulário da aba Questões várias
              vezes.
            </p>
            <div className="mt-3">
              <ImportarQuestoesForm avaliacaoId={avaliacaoBase.id} />
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold text-foreground">Importar resultados</h2>
            <p className="mt-1 text-xs text-foreground-muted/70">
              Lança resultados de estudantes em lote — mesma semântica de escrita do formulário da aba Resultados
              (atualiza em vez de duplicar quando o estudante já tem resultado nesta avaliação).
            </p>
            <div className="mt-3">
              <ImportarResultadosForm avaliacaoId={avaliacaoBase.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
