import Link from "next/link";
import { ClipboardCheck, Percent, TrendingUp, Users } from "lucide-react";
import { getCaedFiltrosDisponiveis, getCaedResumoPorCiclo } from "@/lib/queries/avaliacoes";
import { CAED_TURMA_SENTINELA_ESCOLA } from "@/lib/caed-catalogo";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LevelDistributionBar } from "@/components/ui/charts/level-distribution-bar";
import { MiniBarChart, type MiniBarDatum } from "@/components/ui/charts/mini-bar-chart";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { HabilidadeGrid } from "./habilidade-grid";

interface PageProps {
  searchParams: { etapa?: string; componente?: string; avaliacao?: string; tab?: string; page?: string; pageSize?: string };
}

const TABS = [
  { id: "participacao", label: "Participação e desempenho" },
  { id: "habilidade", label: "Acerto por habilidade" },
] as const;

export default async function PainelCaedPage({ searchParams }: PageProps) {
  const opcoes = await getCaedFiltrosDisponiveis();

  if (opcoes.etapas.length === 0 || opcoes.componentes.length === 0) {
    return (
      <div>
        <PageHeader
          title="Painel CAEd"
          description="Avaliação Contínua da Aprendizagem — Criança Alfabetizada"
        />
        <EmptyState
          className="mt-6"
          icon={ClipboardCheck}
          title="Nenhum dado do CAEd importado ainda"
          description="Importe pelo menos um ciclo para ver participação, desempenho e acerto por habilidade aqui."
          action={
            <Link href="/admin/avaliacoes/caed/importar" className={buttonVariants({ variant: "primary" })}>
              Importar CAEd
            </Link>
          }
        />
      </div>
    );
  }

  const etapaSelecionada = opcoes.etapas.find((e) => e.valor === searchParams.etapa)?.valor ?? opcoes.etapas[0]!.valor;
  const componenteSelecionado = opcoes.componentes.find((c) => c.slug === searchParams.componente)?.slug ?? opcoes.componentes[0]!.slug;
  const etapaLabel = opcoes.etapas.find((e) => e.valor === etapaSelecionada)?.label ?? etapaSelecionada;
  const componenteLabel = opcoes.componentes.find((c) => c.slug === componenteSelecionado)?.label ?? componenteSelecionado;

  const ciclos = await getCaedResumoPorCiclo({ etapaEnsino: etapaSelecionada, componenteSlug: componenteSelecionado });

  const filtros = (
    <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
      <div className="w-56">
        <label className="mb-1 block text-xs text-foreground-muted">Ano escolar</label>
        <Select name="etapa" defaultValue={etapaSelecionada}>
          {opcoes.etapas.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-56">
        <label className="mb-1 block text-xs text-foreground-muted">Componente curricular</label>
        <Select name="componente" defaultValue={componenteSelecionado}>
          {opcoes.componentes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      {ciclos.length > 0 && (
        <div className="w-48">
          <label className="mb-1 block text-xs text-foreground-muted">Avaliação</label>
          <Select name="avaliacao" defaultValue={searchParams.avaliacao}>
            {[...ciclos].reverse().map((c) => (
              <option key={`${c.codigoCiclo}${c.ano}`} value={`${c.codigoCiclo}${c.ano}`}>
                {c.nomeCiclo} / {c.ano}
              </option>
            ))}
          </Select>
        </div>
      )}
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );

  if (ciclos.length === 0) {
    return (
      <div>
        <PageHeader title="Painel CAEd" description="Avaliação Contínua da Aprendizagem — Criança Alfabetizada" />
        {filtros}
        <EmptyState
          className="mt-6"
          icon={ClipboardCheck}
          title="Sem dados para esta combinação"
          description={`Nenhum ciclo importado para ${etapaLabel} · ${componenteLabel}.`}
        />
      </div>
    );
  }

  const avaliacaoParam = searchParams.avaliacao;
  const cicloSelecionado = ciclos.find((c) => `${c.codigoCiclo}${c.ano}` === avaliacaoParam) ?? ciclos[ciclos.length - 1]!;
  const anoSelecionado = cicloSelecionado.ano;
  const ciclosDoAno = ciclos.filter((c) => c.ano === anoSelecionado);

  const tab = searchParams.tab === "habilidade" ? "habilidade" : "participacao";
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams, { defaultPageSize: 10, allowedPageSizes: [10, 20, 50] });
  const porEscola = cicloSelecionado.resumo.porEscola;
  const paginaEscolas = porEscola.slice(skip, skip + take);

  function tabHref(tabId: string) {
    const params = new URLSearchParams();
    params.set("etapa", etapaSelecionada);
    params.set("componente", componenteSelecionado);
    if (avaliacaoParam) params.set("avaliacao", avaliacaoParam);
    params.set("tab", tabId);
    return `/admin/avaliacoes/caed?${params.toString()}`;
  }

  const evolucaoData: MiniBarDatum[] = ciclos
    .filter((c) => c.resumo.mediaAdequado !== null)
    .map((c) => ({ label: `${c.nomeCiclo} ${c.ano}`, value: c.resumo.mediaAdequado!, accent: "education" as const }));

  return (
    <div>
      <PageHeader
        title="Painel CAEd"
        description="Avaliação Contínua da Aprendizagem — Criança Alfabetizada"
        metadata={`${etapaLabel} · ${componenteLabel}`}
      />
      {filtros}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Participação e desempenho</h2>
        <div className={cn("mt-3 grid gap-4", ciclosDoAno.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
          {ciclosDoAno.map((c) => {
            const ponderado = c.resumo.mediaAdequadoPonderada !== null;
            const defasagem = c.resumo.mediaDefasagemPonderada ?? c.resumo.mediaDefasagem;
            const intermediario = c.resumo.mediaIntermediarioPonderada ?? c.resumo.mediaIntermediario;
            const adequado = c.resumo.mediaAdequadoPonderada ?? c.resumo.mediaAdequado;

            return (
              <div key={c.avaliacaoId} className="rounded-xl border border-border bg-surface p-5">
                <div className="text-sm font-semibold text-foreground">
                  {c.nomeCiclo} · {c.ano}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Estudantes avaliados"
                    value={c.resumo.totalAvaliados !== null ? c.resumo.totalAvaliados : "—"}
                    icon={Users}
                    accent="info"
                  />
                  <MetricCard
                    label="Aprendizagem adequada"
                    value={adequado !== null ? `${adequado.toFixed(0)}%` : "—"}
                    helpText={ponderado ? "Ponderado por estudante avaliado" : "Média simples entre escolas — sem contagem de estudante ainda"}
                    icon={Percent}
                    accent="education"
                  />
                </div>
                {(defasagem !== null || intermediario !== null || adequado !== null) && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                      Distribuição por nível de aprendizagem
                    </div>
                    <LevelDistributionBar
                      data={[
                        { label: "Defasagem", percentual: defasagem ?? 0, accent: "warning" },
                        { label: "Aprendizado intermediário", percentual: intermediario ?? 0, accent: "info" },
                        { label: "Aprendizado adequado", percentual: adequado ?? 0, accent: "education" },
                      ]}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-foreground-muted/70">
          {ciclosDoAno.some((c) => c.resumo.mediaAdequadoPonderada !== null)
            ? "Ponderado pelo número de estudantes avaliados de cada escola quando esse dado existe (mesmo método do CAEd); cai para média simples entre escolas nas linhas sem essa contagem."
            : "Média simples entre escolas/turmas com dado nesta rede — não ponderada por estudante avaliado (esse número ainda não foi importado), nunca uma nota oficial da rede."}
        </p>
      </div>

      {evolucaoData.length > 1 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-foreground-muted" />
            Evolução — % de aprendizagem adequada por ciclo
          </h2>
          <p className="mt-1 text-xs text-foreground-muted/70">
            Todos os ciclos já importados para {etapaLabel} · {componenteLabel} — o próprio portal do CAEd não
            mostra essa série, só o ciclo selecionado; aqui dá pra comparar ao longo do tempo.
          </p>
          <div className="mt-3 rounded-xl border border-border bg-surface p-5">
            <MiniBarChart data={evolucaoData} height={200} />
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Percentual de acerto por habilidade</h2>
        <p className="mt-1 text-xs text-foreground-muted/70">
          {cicloSelecionado.nomeCiclo} · {cicloSelecionado.ano} — média entre escolas/turmas com dado.
        </p>
        <div className="mt-3">
          <HabilidadeGrid porHabilidade={cicloSelecionado.resumo.porHabilidade} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Visão detalhada por escola</h2>
        <nav className="mt-3 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4">
          {tab === "participacao" ? (
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Escola</TableHeadCell>
                  <TableHeadCell>Previstos</TableHeadCell>
                  <TableHeadCell>Avaliados</TableHeadCell>
                  <TableHeadCell>% Participação</TableHeadCell>
                  <TableHeadCell>Defasagem</TableHeadCell>
                  <TableHeadCell>Intermediário</TableHeadCell>
                  <TableHeadCell>Adequado</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {paginaEscolas.map((l) => (
                  <TableRow key={`${l.escolaId}:${l.turma}`}>
                    <TableCell className="font-medium text-foreground">
                      {l.escolaNome}
                      {l.turma !== CAED_TURMA_SENTINELA_ESCOLA && <span className="text-foreground-muted"> — {l.turma}</span>}
                    </TableCell>
                    <TableCell className="text-foreground-muted">{l.previstos ?? "—"}</TableCell>
                    <TableCell className="text-foreground-muted">{l.avaliados ?? "—"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {l.percentualParticipacao !== null ? `${l.percentualParticipacao}%` : "—"}
                    </TableCell>
                    <TableCell className="text-foreground-muted">{l.percentualDefasagem !== null ? `${l.percentualDefasagem}%` : "—"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {l.percentualIntermediario !== null ? `${l.percentualIntermediario}%` : "—"}
                    </TableCell>
                    <TableCell className="text-foreground-muted">{l.percentualAdequado !== null ? `${l.percentualAdequado}%` : "—"}</TableCell>
                  </TableRow>
                ))}
                {paginaEscolas.length === 0 && <TableEmptyState colSpan={7} title="Nenhuma escola com dado nesta avaliação." />}
              </TableBody>
            </DataTable>
          ) : (
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Escola</TableHeadCell>
                  <TableHeadCell>Acerto total</TableHeadCell>
                  {cicloSelecionado.resumo.porHabilidade.map((h) => (
                    <TableHeadCell key={h.habilidade}>{h.habilidade}</TableHeadCell>
                  ))}
                </tr>
              </TableHeader>
              <TableBody>
                {paginaEscolas.map((l) => {
                  const valores = Object.values(l.acertoPorHabilidade ?? {});
                  const acertoTotal = valores.length > 0 ? valores.reduce((soma, v) => soma + v, 0) / valores.length : null;
                  return (
                    <TableRow key={`${l.escolaId}:${l.turma}`}>
                      <TableCell className="font-medium text-foreground">
                        {l.escolaNome}
                        {l.turma !== CAED_TURMA_SENTINELA_ESCOLA && <span className="text-foreground-muted"> — {l.turma}</span>}
                      </TableCell>
                      <TableCell className="text-foreground-muted">{acertoTotal !== null ? `${acertoTotal.toFixed(0)}%` : "—"}</TableCell>
                      {cicloSelecionado.resumo.porHabilidade.map((h) => {
                        const valor = l.acertoPorHabilidade?.[h.habilidade] ?? null;
                        return (
                          <TableCell key={h.habilidade} className="text-foreground-muted">
                            {valor !== null ? `${valor}%` : "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
                {paginaEscolas.length === 0 && (
                  <TableEmptyState colSpan={2 + cicloSelecionado.resumo.porHabilidade.length} title="Nenhuma escola com dado nesta avaliação." />
                )}
              </TableBody>
            </DataTable>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPagesFor(porEscola.length, pageSize)}
          basePath="/admin/avaliacoes/caed"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
