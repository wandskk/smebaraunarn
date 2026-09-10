"use client";

import { LineChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniBarChart, type MiniBarDatum } from "./mini-bar-chart";
import type { ChartAccent } from "./accent-colors";

export interface EvolucaoAnualPonto {
  ano: number;
  /** Null vira "sem dado nesse ano" — o ponto é filtrado antes de plotar, não vira uma barra de altura 0. */
  valor: number | null;
  /** Rótulo alternativo (ex.: painel CAEd usa "1º Ciclo 2025" quando há mais de um ciclo por ano); default `String(ano)`. */
  label?: string;
}

export type UnidadeEvolucaoAnual = "percentual" | "numero";

export interface HistoricalEvolutionChartProps {
  data: EvolucaoAnualPonto[];
  accent?: ChartAccent;
  height?: number;
  unidade?: UnidadeEvolucaoAnual;
  className?: string;
}

const FORMATADOR_POR_UNIDADE: Record<UnidadeEvolucaoAnual, (valor: number) => string> = {
  percentual: (valor) => `${valor.toFixed(1)}%`,
  numero: (valor) => valor.toFixed(1),
};

/**
 * Texto de transparência obrigatório em toda seção que usa este gráfico —
 * comparar médias transversais da rede por ano é diferente de acompanhar os
 * mesmos estudantes ao longo do tempo, e essa distinção não pode ficar
 * implícita (ver docs/plano-evolucao-sme/etapas/09-avaliacoes-municipais.md,
 * decisão técnica 6, sobre não comparar coortes incompatíveis
 * silenciosamente). Cada página compõe este texto com seu próprio contexto
 * em vez do componente impor um parágrafo genérico.
 */
export const TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL =
  "Comparação entre o conjunto de estudantes/turmas de cada ano — não acompanha os mesmos estudantes ao longo do tempo.";

/**
 * Evolução ano a ano de um indicador — generaliza o padrão já provado no
 * painel CAEd (`app/admin/avaliacoes/caed/page.tsx`, branch `feat/painel-caed`):
 * busca todos os anos disponíveis de uma métrica, filtra os sem dado, plota
 * com `MiniBarChart`. Barras, não linha — com tipicamente 2-6 anos
 * (pontos discretos), uma linha sugeriria uma continuidade temporal que não
 * existe; `TimeSeriesChart` continua reservado para séries diárias
 * contínuas (ex.: frequência dos últimos 30 dias).
 */
export function HistoricalEvolutionChart({
  data,
  accent = "primary",
  height = 200,
  unidade = "numero",
  className,
}: HistoricalEvolutionChartProps) {
  const pontosValidos = data.filter((ponto): ponto is EvolucaoAnualPonto & { valor: number } => ponto.valor !== null);

  if (pontosValidos.length <= 1) {
    return (
      <EmptyState
        className={className}
        icon={LineChart}
        title="Ainda não há anos suficientes para comparar."
        description="O gráfico de evolução aparece automaticamente quando houver dado de 2 anos ou mais."
      />
    );
  }

  const valueFormatter = FORMATADOR_POR_UNIDADE[unidade];
  const chartData: MiniBarDatum[] = pontosValidos.map((ponto) => ({
    label: ponto.label ?? String(ponto.ano),
    value: ponto.valor,
    accent,
  }));

  return <MiniBarChart data={chartData} accent={accent} height={height} valueFormatter={valueFormatter} className={className} />;
}
