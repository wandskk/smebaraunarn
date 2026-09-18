import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  TrendingUp,
  School,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import {
  HistoricalEvolutionChart,
  TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL,
  type EvolucaoAnualPonto,
} from "@/components/ui/charts/historical-evolution-chart";
import { LevelDistributionBar, type LevelDistributionDatum } from "@/components/ui/charts/level-distribution-bar";
import { MiniBarChart, type MiniBarDatum } from "@/components/ui/charts/mini-bar-chart";
import type { ChartAccent } from "@/components/ui/charts/accent-colors";
import {
  getSaebAnos,
  getSaebResumoComDelta,
  getSaebEvolucaoTemporal,
  getSaebNiveisProficiencia,
  getSaebComparativoLocalizacao,
  getSaebComparativoDependencia,
  getSaebEscolas,
  SAEB_DEP_TOTAL,
  SAEB_DEP_MUNICIPAL,
  SAEB_LOC_TOTAL,
  type SaebSerie,
  type SaebComponente,
} from "@/lib/queries/saeb";

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type Tab = "visao-geral" | "evolucao" | "niveis" | "escolas" | "comparativos";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: BookOpen },
  { id: "evolucao", label: "Evolução", icon: TrendingUp },
  { id: "niveis", label: "Níveis de Proficiência", icon: BarChart3 },
  { id: "escolas", label: "Escolas", icon: School },
  { id: "comparativos", label: "Comparativos", icon: GitCompare },
];

const SERIES_OPTIONS: { value: SaebSerie; label: string }[] = [
  { value: "5", label: "5º ano (Anos Iniciais)" },
  { value: "9", label: "9º ano (Anos Finais)" },
  { value: "12", label: "3ª série EM" },
];

const COMPONENTE_OPTIONS: { value: SaebComponente; label: string }[] = [
  { value: "LP", label: "Língua Portuguesa" },
  { value: "MT", label: "Matemática" },
];

const SEGMENTO_OPTIONS = [
  { value: "", label: "Todos os segmentos" },
  { value: "iniciais", label: "Anos Iniciais (5º ano)" },
  { value: "finais", label: "Anos Finais (9º ano)" },
  { value: "medio", label: "Ensino Médio" },
];

// Mapa de níveis de proficiência SAEB → descrição e cor semântica
const NIVEL_META: Record<string, { label: string; accent: ChartAccent }> = {
  "0": { label: "Nível 0 — Abaixo do básico", accent: "danger" },
  "1": { label: "Nível 1 — Abaixo do básico", accent: "danger" },
  "2": { label: "Nível 2 — Básico", accent: "warning" },
  "3": { label: "Nível 3 — Básico", accent: "warning" },
  "4": { label: "Nível 4 — Adequado", accent: "info" },
  "5": { label: "Nível 5 — Adequado", accent: "info" },
  "6": { label: "Nível 6 — Avançado", accent: "success" },
  "7": { label: "Nível 7 — Avançado", accent: "success" },
  "8": { label: "Nível 8 — Avançado", accent: "success" },
  "9": { label: "Nível 9 — Avançado", accent: "success" },
  "10": { label: "Nível 10 — Avançado", accent: "success" },
};

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function formatMedia(v: number | null): string {
  return v === null ? "—" : v.toFixed(1);
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-foreground-muted/60">—</span>;
  const abs = Math.abs(delta).toFixed(1);
  if (Math.abs(delta) < 0.5) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-foreground-muted">
        <Minus className="h-3 w-3" />
        estável
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-success font-medium">
        <ArrowUpRight className="h-3 w-3" />+{abs} pts
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-danger font-medium">
      <ArrowDownRight className="h-3 w-3" />
      {abs} pts
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground">{children}</h2>;
}

// ─── Page Props ───────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    tab?: string;
    ano?: string;
    serie?: string;
    componente?: string;
    segmento?: string;
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SaebPage({ searchParams }: PageProps) {
  const anos = await getSaebAnos();

  if (anos.length === 0) {
    return (
      <div>
        <PageHeader
          title="SAEB — Baraúna/RN"
          description="Sistema de Avaliação da Educação Básica · INEP"
        />
        <EmptyState
          className="mt-8"
          icon={BarChart3}
          title="Nenhum dado SAEB importado"
          description="Execute o script de importação para carregar os dados das planilhas oficiais do INEP."
          action={
            <code className="rounded bg-surface-muted px-2 py-1 text-xs font-mono text-foreground-muted">
              node scripts/import-saeb.mjs
            </code>
          }
        />
      </div>
    );
  }

  // ── Parâmetros de filtro ───────────────────────────────────────────────────

  const tab = (TABS.find((t) => t.id === searchParams.tab)?.id ?? "visao-geral") as Tab;
  const anoSelecionado = searchParams.ano ? Number(searchParams.ano) : anos[anos.length - 1]!;
  const serie = (searchParams.serie ?? "5") as SaebSerie;
  const componente = (searchParams.componente ?? "LP") as SaebComponente;
  const segmento = searchParams.segmento ?? "";

  // ── Dados por aba (carregados em paralelo) ─────────────────────────────────

  const [resumo, evolucao, niveis, escolas, comparativoLoc, comparativoDep] = await Promise.all([
    getSaebResumoComDelta(anoSelecionado, SAEB_DEP_TOTAL, SAEB_LOC_TOTAL),
    tab === "evolucao"
      ? getSaebEvolucaoTemporal(serie, componente, SAEB_DEP_TOTAL, SAEB_LOC_TOTAL)
      : Promise.resolve([] as EvolucaoAnualPonto[]),
    tab === "niveis"
      ? getSaebNiveisProficiencia(anoSelecionado, serie, componente)
      : Promise.resolve([]),
    tab === "escolas"
      ? getSaebEscolas(anoSelecionado, segmento || undefined)
      : Promise.resolve([]),
    tab === "comparativos"
      ? getSaebComparativoLocalizacao(anoSelecionado, SAEB_DEP_TOTAL)
      : Promise.resolve([]),
    tab === "comparativos"
      ? getSaebComparativoDependencia(anoSelecionado, SAEB_LOC_TOTAL)
      : Promise.resolve([]),
  ]);

  // ── Construção das URLs de filtro ──────────────────────────────────────────

  function tabHref(tabId: string, extra?: Record<string, string>) {
    const p = new URLSearchParams();
    p.set("tab", tabId);
    p.set("ano", String(anoSelecionado));
    p.set("serie", serie);
    p.set("componente", componente);
    if (segmento) p.set("segmento", segmento);
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `/admin/avaliacoes/saeb?${p.toString()}`;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="SAEB — Baraúna/RN"
        description="Sistema de Avaliação da Educação Básica · INEP"
        metadata={`${anos[0]} – ${anos[anos.length - 1]}`}
      />

      {/* Seletor global de ano */}
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value={tab} />
        <input type="hidden" name="serie" value={serie} />
        <input type="hidden" name="componente" value={componente} />
        <div className="w-40">
          <label className="mb-1 block text-xs text-foreground-muted">Ano SAEB</label>
          <Select name="ano" defaultValue={String(anoSelecionado)}>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {/* Abas de navegação */}
      <nav className="mt-6 flex gap-1 border-b border-border" aria-label="Seções do SAEB">
        {TABS.map((t) => {
          const Icon = t.icon;
          const ativo = t.id === tab;
          return (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                "border-b-2 -mb-px",
                ativo
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* ── ABA: Visão Geral ─────────────────────────────────────────────────── */}
      {tab === "visao-geral" && (
        <div className="mt-8 space-y-8">
          {resumo ? (
            <>
              <div>
                <SectionTitle>Proficiência — {anoSelecionado}</SectionTitle>
                <p className="mt-1 text-xs text-foreground-muted">
                  Média da Escala SAEB · Total (todas as redes, área total)
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "LP — 5º ano", valor: resumo.media5Lp, delta: resumo.delta5Lp, accent: "education" as ChartAccent },
                    { label: "MT — 5º ano", valor: resumo.media5Mt, delta: resumo.delta5Mt, accent: "primary" as ChartAccent },
                    { label: "LP — 9º ano", valor: resumo.media9Lp, delta: resumo.delta9Lp, accent: "education" as ChartAccent },
                    { label: "MT — 9º ano", valor: resumo.media9Mt, delta: resumo.delta9Mt, accent: "primary" as ChartAccent },
                  ].map(({ label, valor, delta, accent }) => (
                    <div key={label} className="rounded-xl border border-border bg-surface p-4">
                      <p className="text-xs font-medium text-foreground-muted">{label}</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                        {formatMedia(valor)}
                      </p>
                      <div className="mt-1">
                        <DeltaBadge delta={delta ?? null} />
                      </div>
                    </div>
                  ))}
                </div>
                {resumo.media12Lp !== null || resumo.media12Mt !== null ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "LP — 3ª série EM", valor: resumo.media12Lp },
                      { label: "MT — 3ª série EM", valor: resumo.media12Mt },
                    ].map(({ label, valor }) => (
                      <div key={label} className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-foreground-muted">{label}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                          {formatMedia(valor)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Série histórica compacta */}
              <div>
                <SectionTitle>Evolução rápida — LP e MT no 5º ano</SectionTitle>
                <p className="mt-1 text-xs text-foreground-muted">{TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL}</p>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {(["LP", "MT"] as const).map((comp) => (
                    <div key={comp} className="rounded-xl border border-border bg-surface p-5">
                      <p className="mb-3 text-sm font-medium text-foreground">
                        {comp === "LP" ? "Língua Portuguesa" : "Matemática"} — 5º ano
                      </p>
                      <QuickEvolucao serie="5" componente={comp} />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-foreground-muted">
                  <Link href={tabHref("evolucao")} className="text-primary hover:underline">
                    Ver evolução completa →
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Sem dados para este ano"
              description={`Não há registros SAEB para ${anoSelecionado}.`}
            />
          )}
        </div>
      )}

      {/* ── ABA: Evolução ────────────────────────────────────────────────────── */}
      {tab === "evolucao" && (
        <div className="mt-8 space-y-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="evolucao" />
            <input type="hidden" name="ano" value={String(anoSelecionado)} />
            <div className="w-52">
              <label className="mb-1 block text-xs text-foreground-muted">Série</label>
              <Select name="serie" defaultValue={serie}>
                {SERIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <label className="mb-1 block text-xs text-foreground-muted">Componente</label>
              <Select name="componente" defaultValue={componente}>
                {COMPONENTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">Aplicar</Button>
          </form>

          <div className="rounded-xl border border-border bg-surface p-6">
            <SectionTitle>
              Evolução — {componente === "LP" ? "Língua Portuguesa" : "Matemática"} ·{" "}
              {SERIES_OPTIONS.find((s) => s.value === serie)?.label}
            </SectionTitle>
            <p className="mt-1 mb-4 text-xs text-foreground-muted">
              {TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL}
            </p>
            <HistoricalEvolutionChart
              data={evolucao}
              accent="education"
              height={240}
              unidade="numero"
            />
          </div>

          {/* Grade com todas as combinações */}
          <SectionTitle>Todas as séries — {anoSelecionado}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["5", "9", "12"] as const).flatMap((s) =>
              (["LP", "MT"] as const).map((c) => ({
                serie: s,
                componente: c,
                label: `${c === "LP" ? "Língua Portuguesa" : "Matemática"} — ${SERIES_OPTIONS.find((o) => o.value === s)?.label}`,
              }))
            ).map(({ serie: s, componente: c, label }) => (
              <MiniSeriesCard key={`${s}-${c}`} serie={s} componente={c} label={label} />
            ))}
          </div>
        </div>
      )}

      {/* ── ABA: Níveis de Proficiência ─────────────────────────────────────── */}
      {tab === "niveis" && (
        <div className="mt-8 space-y-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="niveis" />
            <input type="hidden" name="ano" value={String(anoSelecionado)} />
            <div className="w-52">
              <label className="mb-1 block text-xs text-foreground-muted">Série</label>
              <Select name="serie" defaultValue={serie}>
                {SERIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <label className="mb-1 block text-xs text-foreground-muted">Componente</label>
              <Select name="componente" defaultValue={componente}>
                {COMPONENTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">Aplicar</Button>
          </form>

          {niveis.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface p-6">
              <SectionTitle>
                Distribuição de Níveis — {componente === "LP" ? "Língua Portuguesa" : "Matemática"} ·{" "}
                {SERIES_OPTIONS.find((s) => s.value === serie)?.label} · {anoSelecionado}
              </SectionTitle>

              {/* Percentual abaixo do básico — destaque */}
              {(() => {
                const abaixo = niveis
                  .filter((n) => n.nivel === "0" || n.nivel === "1")
                  .reduce((acc, n) => acc + n.percentual, 0);
                return abaixo > 0 ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-danger-subtle px-3 py-1.5 text-sm text-danger">
                    <span className="font-semibold">{abaixo.toFixed(1)}%</span>
                    <span className="text-danger/80">dos alunos abaixo do básico (níveis 0 e 1)</span>
                  </div>
                ) : null;
              })()}

              <div className="mt-4">
                <LevelDistributionBar
                  data={niveis.map((n) => ({
                    label: NIVEL_META[n.nivel]?.label ?? `Nível ${n.nivel}`,
                    percentual: n.percentual,
                    accent: NIVEL_META[n.nivel]?.accent ?? "info",
                  } satisfies LevelDistributionDatum))}
                />
              </div>

              {/* Tabela detalhada */}
              <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted">
                      <th className="px-4 py-2 text-left font-medium text-foreground-muted">Nível</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground-muted">Classificação</th>
                      <th className="px-4 py-2 text-right font-medium text-foreground-muted">% de alunos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niveis.map((n) => (
                      <tr key={n.nivel} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-mono text-xs text-foreground-muted">{n.nivel}</td>
                        <td className="px-4 py-2 text-foreground">{NIVEL_META[n.nivel]?.label ?? `Nível ${n.nivel}`}</td>
                        <td className="px-4 py-2 text-right font-medium text-foreground">{n.percentual.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Sem dados de níveis para esta seleção"
              description="Tente outra combinação de série e componente."
            />
          )}
        </div>
      )}

      {/* ── ABA: Escolas ─────────────────────────────────────────────────────── */}
      {tab === "escolas" && (
        <div className="mt-8 space-y-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="escolas" />
            <input type="hidden" name="ano" value={String(anoSelecionado)} />
            <div className="w-56">
              <label className="mb-1 block text-xs text-foreground-muted">Segmento</label>
              <Select name="segmento" defaultValue={segmento}>
                {SEGMENTO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">Aplicar</Button>
          </form>

          {escolas.length > 0 ? (
            <div>
              <p className="mb-3 text-xs text-foreground-muted">
                {escolas.length} escola(s) com dados para {anoSelecionado} ·{" "}
                {escolas.filter((e) => e.escolaId).length} vinculadas ao cadastro SIGEduc
              </p>
              <DataTable>
                <TableHeader>
                  <tr>
                    <TableHeadCell>Escola</TableHeadCell>
                    <TableHeadCell>Rede</TableHeadCell>
                    <TableHeadCell>Segmento</TableHeadCell>
                    <TableHeadCell>Ind. Rendimento</TableHeadCell>
                    <TableHeadCell>Alunos SIGEduc</TableHeadCell>
                    <TableHeadCell className="text-right">Vínculo</TableHeadCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {escolas.map((e) => {
                    const ir = e.indicadorRend
                      ? Object.entries(e.indicadorRend).sort(([a], [b]) => Number(b) - Number(a))
                      : [];
                    const irAtual = ir.find(([ano]) => ano === String(anoSelecionado));
                    const irValor = irAtual ? irAtual[1] : ir[0]?.[1] ?? null;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-foreground">
                          {e.nomeEscola}
                        </TableCell>
                        <TableCell className="text-foreground-muted">{e.rede}</TableCell>
                        <TableCell className="text-foreground-muted capitalize">{e.segmento}</TableCell>
                        <TableCell className="text-foreground">
                          {irValor !== null ? (
                            <span className={cn(
                              "font-semibold",
                              irValor >= 0.9 ? "text-success" : irValor >= 0.7 ? "text-warning" : "text-danger"
                            )}>
                              {irValor.toFixed(4)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-foreground-muted">
                          {e.totalAlunos !== null ? e.totalAlunos : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {e.escolaId ? (
                            <Link
                              href={`/admin/escolas/${e.escolaId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Ver escola
                            </Link>
                          ) : (
                            <span className="text-xs text-foreground-muted/50">{e.codigoInep}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {escolas.length === 0 && (
                    <TableEmptyState colSpan={6} title="Nenhuma escola encontrada." />
                  )}
                </TableBody>
              </DataTable>
            </div>
          ) : (
            <EmptyState
              icon={School}
              title="Sem dados de escolas para este ano"
              description={`Dados por escola estão disponíveis em 2023 e 2025.`}
            />
          )}
        </div>
      )}

      {/* ── ABA: Comparativos ────────────────────────────────────────────────── */}
      {tab === "comparativos" && (
        <div className="mt-8 space-y-8">

          {/* Comparativo Localização */}
          <div>
            <SectionTitle>Urbana × Rural — {anoSelecionado}</SectionTitle>
            <p className="mt-1 text-xs text-foreground-muted">
              Médias de proficiência por localização · Total de redes
            </p>
            {comparativoLoc.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(["LP", "MT"] as const).flatMap((c) =>
                  (["5", "9"] as const).map((s) => ({
                    c,
                    s,
                    label: `${c === "LP" ? "Língua Portuguesa" : "Matemática"} — ${s === "5" ? "5º ano" : "9º ano"}`,
                  }))
                ).map(({ c, s, label }) => {
                  const campo = `media${s}${c === "LP" ? "Lp" : "Mt"}` as
                    "media5Lp" | "media5Mt" | "media9Lp" | "media9Mt";
                  const barData: MiniBarDatum[] = comparativoLoc
                    .filter((r) => r[campo] !== null)
                    .map((r) => ({
                      label: r.label,
                      value: Math.round(r[campo]! * 10) / 10,
                      accent: r.label === "Urbana" ? "info" : r.label === "Rural" ? "attendance" : "primary",
                    }));
                  if (barData.length === 0) return null;
                  return (
                    <div key={`${c}-${s}`} className="rounded-xl border border-border bg-surface p-5">
                      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
                      <MiniBarChart data={barData} height={160} />
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <EmptyState icon={GitCompare} title="Sem dados de localização" description="Tente outro ano." />
            )}
          </div>

          {/* Comparativo Dependência */}
          <div>
            <SectionTitle>Municipal × Estadual — {anoSelecionado}</SectionTitle>
            <p className="mt-1 text-xs text-foreground-muted">
              Médias de proficiência por dependência administrativa · Área total
            </p>
            {comparativoDep.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(["LP", "MT"] as const).flatMap((c) =>
                  (["5", "9"] as const).map((s) => ({
                    c,
                    s,
                    label: `${c === "LP" ? "Língua Portuguesa" : "Matemática"} — ${s === "5" ? "5º ano" : "9º ano"}`,
                  }))
                ).map(({ c, s, label }) => {
                  const campo = `media${s}${c === "LP" ? "Lp" : "Mt"}` as
                    "media5Lp" | "media5Mt" | "media9Lp" | "media9Mt";
                  const barData: MiniBarDatum[] = comparativoDep
                    .filter((r) => r[campo] !== null)
                    .map((r) => ({
                      label: r.label,
                      value: Math.round(r[campo]! * 10) / 10,
                      accent: r.label === "Municipal" ? "education" : r.label === "Estadual" ? "warning" : "primary",
                    }));
                  if (barData.length === 0) return null;
                  return (
                    <div key={`${c}-${s}`} className="rounded-xl border border-border bg-surface p-5">
                      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
                      <MiniBarChart data={barData} height={160} />
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <EmptyState icon={GitCompare} title="Sem dados por dependência" description="Tente outro ano." />
            )}
          </div>

          {/* Comparativo entre anos */}
          <div>
            <SectionTitle>Comparativo entre anos — Rede Municipal</SectionTitle>
            <p className="mt-1 text-xs text-foreground-muted">
              Evolução das médias da rede municipal ao longo de todas as edições disponíveis
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["LP", "MT"] as const).flatMap((c) =>
                (["5", "9"] as const).map((s) => ({ c, s }))
              ).map(({ c, s }) => (
                <EvolucaoCard key={`${s}-${c}`} serie={s as SaebSerie} componente={c} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes assíncronos ──────────────────────────────────────────────

async function QuickEvolucao({ serie, componente }: { serie: SaebSerie; componente: SaebComponente }) {
  const data = await getSaebEvolucaoTemporal(serie, componente, SAEB_DEP_TOTAL, SAEB_LOC_TOTAL);
  return <HistoricalEvolutionChart data={data} accent="education" height={140} unidade="numero" />;
}

async function MiniSeriesCard({ serie, componente, label }: { serie: SaebSerie; componente: SaebComponente; label: string }) {
  const data = await getSaebEvolucaoTemporal(serie, componente, SAEB_DEP_TOTAL, SAEB_LOC_TOTAL);
  const valid = data.filter((d) => d.valor !== null);
  if (valid.length === 0) return null;
  const ultimo = valid[valid.length - 1]!;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{ultimo.valor?.toFixed(1)}</p>
      <p className="text-xs text-foreground-muted">em {ultimo.ano}</p>
      <HistoricalEvolutionChart data={data} accent={componente === "LP" ? "education" : "primary"} height={100} unidade="numero" className="mt-3" />
    </div>
  );
}

async function EvolucaoCard({ serie, componente }: { serie: SaebSerie; componente: SaebComponente }) {
  const data = await getSaebEvolucaoTemporal(serie, componente, SAEB_DEP_MUNICIPAL, SAEB_LOC_TOTAL);
  const label = `${componente === "LP" ? "Língua Portuguesa" : "Matemática"} — ${serie === "5" ? "5º ano" : "9º ano"}`;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      <HistoricalEvolutionChart
        data={data}
        accent={componente === "LP" ? "education" : "primary"}
        height={160}
        unidade="numero"
      />
    </div>
  );
}
