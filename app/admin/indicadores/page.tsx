import Link from "next/link";
import {
  AlertTriangle,
  Award,
  GitCompare,
  GraduationCap,
  Percent,
  School,
  Settings,
  ShieldCheck,
  TrendingDown,
  Users2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getIndicadoresGeraisRede } from "@/lib/queries/indicadores-gerais";
import { getStatusSincronizacao, type StatusModuloSincronizacao } from "@/lib/queries/qualidade-dados";
import { classificarFaixaFrequencia } from "@/lib/analytics/frequencia";
import { DICIONARIO_INDICADORES, descreverContexto, type ContextoExibicao } from "@/lib/analytics/explicabilidade";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard, type MetricCardTone } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";

interface PageProps {
  searchParams: { ano?: string };
}

function formatarPercentual(valor: number | null): string {
  return valor === null ? "-" : `${valor.toFixed(1)}%`;
}

export default async function AdminIndicadoresPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const anoLetivo = resolverAnoLetivo(searchParams, anosDisponiveis);
  // Preserva o ano letivo selecionado ao navegar para os drill-downs, em vez
  // de deixar cada um cair no próprio padrão (achado do master prompt:
  // "contexto deve ser preservado por query params ao navegar em
  // drill-downs" — ETAPA 02).
  const comAno = (href: string) => `${href}?ano=${anoLetivo}`;

  const [indicadores, statusSincronizacao] = await Promise.all([
    getIndicadoresGeraisRede({ anoLetivo }),
    getStatusSincronizacao(),
  ]);

  const statusPorModulo = new Map(statusSincronizacao.modulos.map((m) => [m.modulo, m]));

  // Cada indicador cita a data de atualização do MÓDULO de sincronização do
  // qual ele realmente depende — nunca "a última sincronização de qualquer
  // módulo" (regra 7.5 do master prompt: frequência usa freshness de
  // frequência, notas usam freshness de notas, etc.). Antes desta etapa,
  // todos os indicadores desta página citavam a mesma data global.
  const contextoDoModulo = (modulo: StatusModuloSincronizacao["modulo"]): ContextoExibicao => {
    const status = statusPorModulo.get(modulo);
    const dataAtualizacao = status?.ultimoSucessoEm
      ? status.ultimoSucessoEm.toLocaleString("pt-BR")
      : "sem sincronização registrada";
    return { dataAtualizacao, periodoAnalisado: `Ano letivo ${anoLetivo}` };
  };

  const contextoEstudantes = contextoDoModulo("ESTUDANTES");
  const contextoFrequencia = contextoDoModulo("FREQUENCIA");
  const contextoNotas = contextoDoModulo("NOTAS");

  const faixaFrequenciaRede =
    indicadores.frequenciaMediaRede === null ? null : classificarFaixaFrequencia(indicadores.frequenciaMediaRede);
  const toneFrequencia: MetricCardTone =
    faixaFrequenciaRede === "critica" ? "critico" : faixaFrequenciaRede === "atencao" ? "atencao" : "default";
  const toneAbaixoFaixa: MetricCardTone = indicadores.estudantesAbaixoFaixaFrequencia > 0 ? "atencao" : "default";
  const toneDistorcao: MetricCardTone = indicadores.estudantesEmDistorcaoIdadeSerie > 0 ? "atencao" : "default";

  return (
    <div>
      <PageHeader
        title="Central de Indicadores"
        description="Panorama da rede a partir dos dados sincronizados do SIGEduc. Cada indicador informa sua própria fonte e data de atualização (ícone de informação) — módulos diferentes podem ter sincronizado em momentos diferentes; veja Qualidade dos dados para o detalhe completo por módulo."
        actions={
          <>
            {anosDisponiveis.length > 1 && (
              <form method="get" className="flex items-center gap-2">
                <Select name="ano" defaultValue={anoLetivo} className="w-auto">
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
            )}
            <Link href={comAno("/admin/indicadores/comparativos")} className={buttonVariants({ variant: "secondary" })}>
              <GitCompare className="h-4 w-4" />
              Comparativos
            </Link>
            <Link href="/admin/indicadores/qualidade" className={buttonVariants({ variant: "secondary" })}>
              <ShieldCheck className="h-4 w-4" />
              Qualidade dos dados
            </Link>
            <Link href="/admin/indicadores/portal-publico" className={buttonVariants({ variant: "secondary" })}>
              <Settings className="h-4 w-4" />
              Números da página inicial
            </Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Estudantes matriculados"
          value={formatNumber(indicadores.totalEstudantes)}
          icon={GraduationCap}
          href="/admin/estudantes"
        />
        <MetricCard
          label="Escolas ativas"
          value={formatNumber(indicadores.escolasAtivas)}
          icon={School}
          href="/admin/escolas"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.escolasAtivas, contextoEstudantes)}
        />
        <MetricCard label="Turmas" value={formatNumber(indicadores.totalTurmas)} icon={Users2} />
        <MetricCard
          label="Frequência média da rede"
          value={formatarPercentual(indicadores.frequenciaMediaRede)}
          icon={Percent}
          tone={toneFrequencia}
          accent="attendance"
          href={comAno("/admin/indicadores/frequencia")}
          helpText="Ver por escola →"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.frequenciaMedia, contextoFrequencia)}
        />
        <MetricCard
          label="Estudantes abaixo da faixa adequada de frequência"
          value={formatNumber(indicadores.estudantesAbaixoFaixaFrequencia)}
          icon={AlertTriangle}
          tone={toneAbaixoFaixa}
          accent="attendance"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.estudantesAbaixoFaixaFrequencia, contextoFrequencia)}
        />
        <MetricCard
          label="Desempenho médio"
          value={indicadores.desempenhoMedioRede === null ? "-" : indicadores.desempenhoMedioRede.toFixed(1)}
          icon={Award}
          accent="education"
          href={comAno("/admin/indicadores/aprendizagem")}
          helpText="Ver por escola →"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.desempenhoMedio, contextoNotas)}
        />
        <MetricCard
          label="Estudantes em distorção idade-série"
          value={formatNumber(indicadores.estudantesEmDistorcaoIdadeSerie)}
          icon={TrendingDown}
          tone={toneDistorcao}
          accent="warning"
          href={comAno("/admin/indicadores/fluxo-trajetoria")}
          helpText="Não é o total da rede (ver nota abaixo) — ver por escola/série →"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.distorcaoIdadeSerie, contextoEstudantes)}
        />
      </div>

      <p className="mt-4 text-xs text-foreground-muted/70">
        {formatNumber(indicadores.estudantesForaDoEscopoOuSemDadosParaDistorcao)} estudante(s) fora do escopo do
        cálculo de distorção idade-série (Educação Infantil, EJA, Educação Especial, turmas multianuais, trilha
        Trajetória de Sucesso, ou com data de nascimento ausente/inválida) — não entram na contagem acima.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-foreground-muted">
        O bloco &quot;Atenção agora&quot; (destaque automático de escolas/turmas com queda recente, direto neste
        painel) ainda não existe. Frequência, desempenho e distorção por escola no mesmo recorte já estão
        disponíveis lado a lado em{" "}
        <Link href={comAno("/admin/indicadores/comparativos")} className="text-primary underline">
          Comparativos
        </Link>{" "}
        — o destaque automático nesta página fica para uma próxima etapa (ver docs/PLANO_DESENVOLVIMENTO.md).
      </div>
    </div>
  );
}
