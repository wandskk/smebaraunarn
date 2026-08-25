"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface HorizontalBarDatum {
  label: string;
  value: number;
  /** Texto já formatado para o tooltip (ex.: "6,8 pts") — sem isso, mostra o número bruto. Pré-formatado no server porque este é um Client Component. */
  valueLabel?: string;
  accent?: ChartAccent;
}

export interface HorizontalBarChartProps {
  data: HorizontalBarDatum[];
  accent?: ChartAccent;
  /** Sem valor, a altura escala com a quantidade de barras. */
  height?: number;
  /** Linha de referência vertical tracejada (ex.: média da rede). */
  referencia?: number;
  className?: string;
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: { payload: HorizontalBarDatum }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]!.payload;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-card">
      <div className="font-medium text-foreground">{d.label}</div>
      <div className="text-foreground-muted">{d.valueLabel ?? d.value}</div>
    </div>
  );
}

/**
 * Barra horizontal (recharts `BarChart` `layout="vertical"`) — para
 * comparar poucas categorias com rótulo longo (nome de escola, item de
 * avaliação) lado a lado, com referência opcional (ex.: média da rede).
 * Compartilhado entre Aprendizagem (ETAPA 05) e Avaliações — itens/
 * descritores com menor % de acerto (ETAPA 07) — só criado por ter esses 2
 * usos reais.
 */
export function HorizontalBarChart({ data, accent = "primary", height, referencia, className }: HorizontalBarChartProps) {
  const alturaCalculada = height ?? Math.max(120, data.length * 32);

  return (
    <div className={cn("w-full", className)} style={{ height: alturaCalculada }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "hsl(var(--surface-muted))" }} />
          {referencia !== undefined && (
            <ReferenceLine x={referencia} stroke="hsl(var(--foreground-muted))" strokeDasharray="4 4" />
          )}
          <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
            {data.map((d) => (
              <Cell key={d.label} fill={ACCENT_COLOR[d.accent ?? accent]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
