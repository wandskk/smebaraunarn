import Link from "next/link";
import {
  AlertTriangle,
  Award,
  GraduationCap,
  Percent,
  School,
  Settings,
  TrendingDown,
  Users2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getIndicadoresGeraisRede } from "@/lib/queries/indicadores-gerais";
import { classificarFaixaFrequencia } from "@/lib/analytics/frequencia";
import { DICIONARIO_INDICADORES, descreverContexto } from "@/lib/analytics/explicabilidade";
import { KpiCard, type KpiCardTone } from "@/components/admin/kpi-card";

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

  const [indicadores, ultimaSincronizacao] = await Promise.all([
    getIndicadoresGeraisRede({ anoLetivo }),
    prisma.logSincronizacao.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const dataAtualizacao = ultimaSincronizacao
    ? ultimaSincronizacao.createdAt.toLocaleString("pt-BR")
    : "sem sincronização registrada";

  const contexto = { dataAtualizacao, periodoAnalisado: `Ano letivo ${anoLetivo}` };

  const faixaFrequenciaRede =
    indicadores.frequenciaMediaRede === null ? null : classificarFaixaFrequencia(indicadores.frequenciaMediaRede);
  const toneFrequencia: KpiCardTone =
    faixaFrequenciaRede === "critica" ? "critico" : faixaFrequenciaRede === "atencao" ? "atencao" : "default";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Central de Indicadores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Panorama da rede a partir dos dados sincronizados do SIGEduc. Última sincronização:{" "}
            {dataAtualizacao}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {anosDisponiveis.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <select
                name="ano"
                defaultValue={anoLetivo}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    Ano letivo {ano}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Aplicar
              </button>
            </form>
          )}
          <Link
            href="/admin/indicadores/portal-publico"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Números da página inicial
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Estudantes matriculados"
          value={formatNumber(indicadores.totalEstudantes)}
          icon={GraduationCap}
          href="/admin/estudantes"
        />
        <KpiCard
          label="Escolas ativas"
          value={formatNumber(indicadores.escolasAtivas)}
          icon={School}
          href="/admin/escolas"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.escolasAtivas, contexto)}
        />
        <KpiCard label="Turmas" value={formatNumber(indicadores.totalTurmas)} icon={Users2} />
        <KpiCard
          label="Frequência média da rede"
          value={formatarPercentual(indicadores.frequenciaMediaRede)}
          icon={Percent}
          tone={toneFrequencia}
          href="/admin/indicadores/frequencia"
          helpText="Ver por escola →"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.frequenciaMedia, contexto)}
        />
        <KpiCard
          label="Estudantes abaixo da faixa adequada de frequência"
          value={formatNumber(indicadores.estudantesAbaixoFaixaFrequencia)}
          icon={AlertTriangle}
          tone={indicadores.estudantesAbaixoFaixaFrequencia > 0 ? "atencao" : "default"}
          explicacao={descreverContexto(DICIONARIO_INDICADORES.estudantesAbaixoFaixaFrequencia, contexto)}
        />
        <KpiCard
          label="Desempenho médio"
          value={indicadores.desempenhoMedioRede === null ? "-" : indicadores.desempenhoMedioRede.toFixed(1)}
          icon={Award}
          href="/admin/indicadores/aprendizagem"
          helpText="Ver por escola →"
          explicacao={descreverContexto(DICIONARIO_INDICADORES.desempenhoMedio, contexto)}
        />
        <KpiCard
          label="Estudantes em distorção idade-série"
          value={formatNumber(indicadores.estudantesEmDistorcaoIdadeSerie)}
          icon={TrendingDown}
          tone={indicadores.estudantesEmDistorcaoIdadeSerie > 0 ? "atencao" : "default"}
          helpText="Não inclui quem já está na trilha Trajetória de Sucesso — é um piso, não o total da rede."
          explicacao={descreverContexto(DICIONARIO_INDICADORES.distorcaoIdadeSerie, contexto)}
        />
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {formatNumber(indicadores.estudantesForaDoEscopoOuSemDadosParaDistorcao)} estudante(s) fora do escopo do
        cálculo de distorção idade-série (Educação Infantil, EJA, Educação Especial, turmas multianuais, trilha
        Trajetória de Sucesso, ou com data de nascimento ausente/inválida) — não entram na contagem acima.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        O bloco &quot;Atenção agora&quot; (destaque automático de escolas/turmas com queda recente, direto neste
        painel) ainda não existe. A comparação de frequência por escola já está disponível em{" "}
        <Link href="/admin/indicadores/frequencia" className="text-brand-700 underline">
          Frequência por Escola
        </Link>{" "}
        — o destaque automático fica para quando desempenho e distorção também tiverem o mesmo recorte por
        escola/turma (ver docs/PLANO_DESENVOLVIMENTO.md, próximas etapas).
      </div>
    </div>
  );
}
