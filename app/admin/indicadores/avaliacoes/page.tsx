import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  Award,
  BookOpen,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import {
  getAnosLetivosDisponiveis,
  ANOS_LETIVOS_COOKIE_NAME,
  resolverSelecaoAnosLetivos,
  anoReferencia,
  anosParaEvolucao,
  montarQueryStringAnos,
} from "@/lib/queries/anos-letivos";
import {
  getEvolucaoCaedPorAno,
  getEvolucaoPontuacaoPorAno,
  getEvolucaoFluenciaPorAno,
  getResumoIndicadoresAvaliacoes,
  TIPO_AVALIACAO_LABEL,
  STATUS_AVALIACAO_LABEL,
  type StatusAvaliacao,
} from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import {
  HistoricalEvolutionChart,
  TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL,
} from "@/components/ui/charts/historical-evolution-chart";
import { AnosLetivosFiltro } from "@/components/ui/anos-letivos-filtro";

const STATUS_BADGE_VARIANT: Record<StatusAvaliacao, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

interface PageProps {
  searchParams: { anos?: string | string[]; ano?: string };
}

export default async function IndicadoresAvaliacoesPage({ searchParams }: PageProps) {
  const cookieStore = cookies();
  const cookieValor = cookieStore.get(ANOS_LETIVOS_COOKIE_NAME)?.value;
  const anosDisponiveis = await getAnosLetivosDisponiveis();
  const selecao = resolverSelecaoAnosLetivos(searchParams, cookieValor, anosDisponiveis);
  const anoLetivo = anoReferencia(selecao);
  const anosParaGrafico = anosParaEvolucao(selecao);
  const queryStringAnos = montarQueryStringAnos(selecao);
  const comAnos = (href: string) => `${href}?${queryStringAnos}`;

  const [resumo, evolucaoCaed, evolucaoFluencia, evolucaoSpadeb, evolucaoSimulado, evolucaoProva] = await Promise.all([
    getResumoIndicadoresAvaliacoes(anoLetivo),
    getEvolucaoCaedPorAno(anosParaGrafico),
    getEvolucaoFluenciaPorAno(anosParaGrafico),
    getEvolucaoPontuacaoPorAno(anosParaGrafico, "SPADEB"),
    getEvolucaoPontuacaoPorAno(anosParaGrafico, "SIMULADO"),
    getEvolucaoPontuacaoPorAno(anosParaGrafico, "PROVA_MUNICIPAL"),
  ]);

  return (
    <div>
      <Link
        href={comAnos("/admin/indicadores")}
        className="inline-flex items-center gap-1 text-sm text-education-subtle-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Avaliações Municipais"
        description={
          <>
            Acompanhamento integrado de resultados e evolução histórica das avaliações municipais da rede (CAEd,
            Fluência Leitora, SPADEB, simulados e provas municipais). Cada instrumento é apresentado com sua métrica
            nativa. Ano de referência: {anoLetivo}.
          </>
        }
        actions={
          <>
            <AnosLetivosFiltro
              anosDisponiveis={anosDisponiveis}
              selecaoAtual={selecao}
              pathname="/admin/indicadores/avaliacoes"
            />
            <Link href="/admin/avaliacoes" className={buttonVariants({ variant: "secondary" })}>
              Gerenciar catálogo
            </Link>
          </>
        }
      />

      {/* Cards de Métricas Gerais do Ano de Referência */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avaliações no Ano"
          value={resumo.totalAvaliacoes}
          helpText={
            resumo.totalAvaliacoes > 0
              ? `${resumo.tiposAtivos.length} tipo(s) com aplicação no ano`
              : "Sem avaliações registradas"
          }
          icon={ClipboardList}
        />
        <MetricCard
          label="CAEd — Aprendizagem Adequada"
          value={resumo.caed.percentualAdequado !== null ? `${resumo.caed.percentualAdequado.toFixed(1)}%` : "-"}
          helpText={
            resumo.caed.totalAvaliacoes > 0
              ? `${formatNumber(resumo.caed.totalAvaliados)} avaliados em ${resumo.caed.totalAvaliacoes} ciclo(s)`
              : "Sem ciclos no ano"
          }
          icon={Award}
          accent="education"
        />
        <MetricCard
          label="Fluência Leitora — Fluentes"
          value={resumo.fluencia.percentualFluente !== null ? `${resumo.fluencia.percentualFluente.toFixed(1)}%` : "-"}
          helpText={
            resumo.fluencia.totalAvaliacoes > 0
              ? `${formatNumber(resumo.fluencia.totalAvaliados)} estudante(s) avaliado(s)`
              : "Sem avaliações de fluência no ano"
          }
          icon={BookOpen}
          accent="education"
        />
        <MetricCard
          label="Participações na Rede"
          value={formatNumber(resumo.totalAvaliadosGeral)}
          helpText={
            resumo.coberturaMedia !== null
              ? `Cobertura média estimada de ${resumo.coberturaMedia.toFixed(1)}%`
              : "Total de resultados registrados no ano"
          }
          icon={Users}
        />
      </div>

      {/* Seção CAEd */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-education" />
            <h2 className="text-base font-semibold text-foreground">
              CAEd — Avaliação Contínua da Aprendizagem
            </h2>
          </div>
          <Link
            href="/admin/avaliacoes/caed"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver painel CAEd completo
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-1 text-xs text-foreground-muted/80">
          Percentual ponderado de estudantes no nível de aprendizagem adequado por ano letivo. Dados provenientes
          dos ciclos de avaliação contínua do Programa Criança Alfabetizada. {TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              <TrendingUp className="h-4 w-4" />
              Evolução histórica do % de aprendizagem adequada
            </h3>
            <div className="mt-4">
              <HistoricalEvolutionChart
                data={evolucaoCaed}
                accent="education"
                height={200}
                unidade="percentual"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Destaques do ano {anoLetivo}
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {resumo.caed.percentualAdequado !== null ? `${resumo.caed.percentualAdequado.toFixed(1)}%` : "-"}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Média ponderada no nível adequado
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatNumber(resumo.caed.totalAvaliados)}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Estudantes avaliados nos ciclos de {anoLetivo}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {resumo.caed.totalAvaliacoes}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Ciclos e edições aplicadas no ano
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-3">
              <Link
                href="/admin/avaliacoes/caed"
                className="text-xs text-primary hover:underline"
              >
                Filtrar por etapa e componente curricular →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Fluência Leitora */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-education" />
          <h2 className="text-base font-semibold text-foreground">Fluência Leitora</h2>
        </div>
        <p className="mt-1 text-xs text-foreground-muted/80">
          Percentual de estudantes com nível de leitura classificado como &quot;Leitor Fluente&quot; sobre o total de
          estudantes avaliados na rede. {TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              <TrendingUp className="h-4 w-4" />
              Evolução histórica — % de leitores fluentes
            </h3>
            <div className="mt-4">
              <HistoricalEvolutionChart
                data={evolucaoFluencia}
                accent="education"
                height={200}
                unidade="percentual"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Destaques do ano {anoLetivo}
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {resumo.fluencia.percentualFluente !== null
                      ? `${resumo.fluencia.percentualFluente.toFixed(1)}%`
                      : "-"}
                  </div>
                  <div className="text-xs text-foreground-muted">Leitores fluentes na rede</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatNumber(resumo.fluencia.totalAvaliados)}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    Estudantes avaliados com diagnóstico de fluência
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {resumo.fluencia.totalAvaliacoes}
                  </div>
                  <div className="text-xs text-foreground-muted">Edições de fluência leitora registradas</div>
                </div>
              </div>
            </div>
            {resumo.fluencia.totalAvaliacoes === 0 && (
              <div className="mt-4 text-xs text-foreground-muted/70">
                Nenhuma avaliação de fluência leitora com dados no ano {anoLetivo}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção SPADEB, Simulados e Provas Municipais */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            SPADEB, Simulados e Provas Municipais
          </h2>
        </div>
        <p className="mt-1 text-xs text-foreground-muted/80">
          Pontuação média histórica das avaliações diagnósticas e somativas com escala contínua de notas na rede.{" "}
          {TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL}
        </p>

        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                SPADEB
              </h3>
              <span className="text-xs text-foreground-muted">
                {resumo.spadeb.totalAvaliacoes} avaliação(ões)
              </span>
            </div>
            <div className="mt-3">
              <HistoricalEvolutionChart
                data={evolucaoSpadeb}
                accent="primary"
                height={160}
                unidade="numero"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-foreground-muted">
              <span>Média em {anoLetivo}:</span>
              <span className="font-semibold text-foreground">
                {resumo.spadeb.mediaPontuacao !== null ? resumo.spadeb.mediaPontuacao.toFixed(1) : "-"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Simulados
              </h3>
              <span className="text-xs text-foreground-muted">
                {resumo.simulado.totalAvaliacoes} avaliação(ões)
              </span>
            </div>
            <div className="mt-3">
              <HistoricalEvolutionChart
                data={evolucaoSimulado}
                accent="primary"
                height={160}
                unidade="numero"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-foreground-muted">
              <span>Média em {anoLetivo}:</span>
              <span className="font-semibold text-foreground">
                {resumo.simulado.mediaPontuacao !== null ? resumo.simulado.mediaPontuacao.toFixed(1) : "-"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Provas Municipais
              </h3>
              <span className="text-xs text-foreground-muted">
                {resumo.provaMunicipal.totalAvaliacoes} avaliação(ões)
              </span>
            </div>
            <div className="mt-3">
              <HistoricalEvolutionChart
                data={evolucaoProva}
                accent="primary"
                height={160}
                unidade="numero"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-foreground-muted">
              <span>Média em {anoLetivo}:</span>
              <span className="font-semibold text-foreground">
                {resumo.provaMunicipal.mediaPontuacao !== null ? resumo.provaMunicipal.mediaPontuacao.toFixed(1) : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Avaliações no Ano Letivo de Referência */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-foreground">
          Avaliações registradas em {anoLetivo}
        </h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Listagem analítica de todas as edições de avaliação com aplicação registrada no ano letivo selecionado.
        </p>

        <div className="mt-3">
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Avaliação</TableHeadCell>
                <TableHeadCell>Tipo</TableHeadCell>
                <TableHeadCell>Etapa</TableHeadCell>
                <TableHeadCell className="text-right">Avaliados</TableHeadCell>
                <TableHeadCell className="text-right">Participação</TableHeadCell>
                <TableHeadCell className="text-right">Métrica Principal</TableHeadCell>
                <TableHeadCell>Situação</TableHeadCell>
                <TableHeadCell className="text-right">Ações</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumo.avaliacoes.length === 0 ? (
                <TableEmptyState
                  colSpan={8}
                  title={`Nenhuma avaliação encontrada para o ano ${anoLetivo}`}
                  description="Selecione outro ano letivo no filtro acima ou acesse o catálogo para cadastrar ou importar novas avaliações."
                />
              ) : (
                resumo.avaliacoes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">
                      <div>{item.nome}</div>
                      <div className="text-xs font-normal text-foreground-muted">{item.codigo}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="text-xs">
                        {TIPO_AVALIACAO_LABEL[item.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground-muted">
                      {item.etapaEnsino ?? "Não informada"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatNumber(item.totalAvaliados)}
                      {item.totalEsperado !== null && (
                        <span className="text-xs font-normal text-foreground-muted">
                          {" "}/ {formatNumber(item.totalEsperado)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.taxaParticipacao !== null ? `${item.taxaParticipacao.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {item.metricaPrincipal.valor !== null ? (
                        item.metricaPrincipal.unidade === "percentual" ? (
                          `${item.metricaPrincipal.valor.toFixed(1)}%`
                        ) : (
                          item.metricaPrincipal.valor.toFixed(1)
                        )
                      ) : (
                        <span className="font-normal text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                        {STATUS_AVALIACAO_LABEL[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.tipo === "AVALIACAO_CONTINUA_CAED" ? (
                        <Link
                          href="/admin/avaliacoes/caed"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Painel CAEd →
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/avaliacoes/${item.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Detalhes →
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
