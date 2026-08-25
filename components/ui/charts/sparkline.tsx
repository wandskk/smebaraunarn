"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface SparklineProps {
  /** Valores em ordem cronológica (ex.: percentual de frequência por dia). */
  data: number[];
  accent?: ChartAccent;
  height?: number;
  showTooltip?: boolean;
  className?: string;
}

/**
 * Tendência mínima (recharts AreaChart sem eixos) — embutida em MetricCard
 * ou usada solta onde uma série curta já existe (ex.: frequência dos
 * últimos 30 dias). `useId` evita colisão de `<linearGradient id>` quando
 * mais de um Sparkline do mesmo accent aparece na mesma página. Ver
 * ETAPA V0 do plano de redesign.
 */
export function Sparkline({ data, accent = "primary", height = 32, showTooltip = false, className }: SparklineProps) {
  const gradientId = `sparkline-gradient-${useId()}`;
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_COLOR[accent]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT_COLOR[accent]} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                backgroundColor: "hsl(var(--surface))",
              }}
              labelFormatter={() => ""}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={ACCENT_COLOR[accent]}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
