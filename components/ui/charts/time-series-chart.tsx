"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { formatarDataIso } from "@/lib/format-date";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface TimeSeriesPonto {
  /** ISO (YYYY-MM-DD). */
  data: string;
  /** Null vira um vazio na linha (recharts simplesmente pula o ponto), não um zero. */
  valor: number | null;
}

/** Unidade do valor — decide a formatação do eixo Y e do tooltip. Uma string (não uma função) para poder atravessar a fronteira Server → Client Component como prop serializável. */
export type TimeSeriesUnidade = "percentual" | "numero";

export interface TimeSeriesChartProps {
  data: TimeSeriesPonto[];
  accent?: ChartAccent;
  height?: number;
  unidade?: TimeSeriesUnidade;
  className?: string;
}

function formatarValor(valor: number, unidade: TimeSeriesUnidade): string {
  return unidade === "percentual" ? `${valor.toFixed(1)}%` : valor.toFixed(1);
}

function TooltipContent({
  active,
  payload,
  unidade,
}: {
  active?: boolean;
  payload?: { payload: TimeSeriesPonto }[];
  unidade: TimeSeriesUnidade;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const ponto = payload[0]!.payload;
  if (ponto.valor === null) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-card">
      <div className="font-medium text-foreground">{formatarDataIso(ponto.data)}</div>
      <div className="text-foreground-muted">{formatarValor(ponto.valor, unidade)}</div>
    </div>
  );
}

/**
 * Série temporal (recharts AreaChart com eixos) — para tendências reais ao
 * longo do tempo (ex.: frequência da rede nos últimos 30 dias), diferente
 * do `Sparkline` (sem eixos, embutido em card). Compartilhado entre a
 * Central e `/admin/indicadores/frequencia` (ver ETAPA 02 do MVP de
 * Indicadores) — só criado por ter esses 2 usos reais confirmados.
 */
export function TimeSeriesChart({
  data,
  accent = "attendance",
  height = 220,
  unidade = "numero",
  className,
}: TimeSeriesChartProps) {
  const gradientId = `time-series-gradient-${useId()}`;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_COLOR[accent]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={ACCENT_COLOR[accent]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="data"
            tickFormatter={(data: string) => formatarDataIso(data).slice(0, 5)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v: number) => formatarValor(v, unidade)}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }}
            domain={unidade === "percentual" ? [0, 100] : ["auto", "auto"]}
          />
          <Tooltip content={<TooltipContent unidade={unidade} />} />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={ACCENT_COLOR[accent]}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            connectNulls
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
