"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface MiniBarDatum {
  label: string;
  value: number;
  /** Sobrescreve `accent` só para esta barra (ex.: destacar um módulo com erro). */
  accent?: ChartAccent;
}

export interface MiniBarChartProps {
  data: MiniBarDatum[];
  accent?: ChartAccent;
  height?: number;
  className?: string;
}

/**
 * Distribuição categórica pequena (recharts BarChart sem eixo Y) — para
 * comparar poucas categorias lado a lado (ex.: erros por módulo). Ver
 * ETAPA V0 do plano de redesign.
 */
export function MiniBarChart({ data, accent = "primary", height = 140, className }: MiniBarChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--surface-muted))" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              backgroundColor: "hsl(var(--surface))",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
            {data.map((d) => (
              <Cell key={d.label} fill={ACCENT_COLOR[d.accent ?? accent]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
