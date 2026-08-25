"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR, ACCENT_TRACK_COLOR, type ChartAccent } from "./accent-colors";

export interface RingProgressProps {
  /** 0-100. `null` renderiza o anel vazio com "-" no centro (sem dado, não zero). */
  value: number | null;
  accent?: ChartAccent;
  size?: number;
  strokeWidth?: number;
  /** Texto abaixo do anel (ex.: "frequência"). */
  label?: string;
  /** Sobrescreve o texto central (default: `${value.toFixed(1)}%`). */
  valueLabel?: string;
  className?: string;
}

/**
 * Anel de progresso (recharts RadialBarChart de uma única barra) — substitui
 * o percentual solto em texto onde o peso visual proporcional ajuda
 * (frequência, cobertura, completude). Ver ETAPA V0 do plano de redesign.
 */
export function RingProgress({
  value,
  accent = "primary",
  size = 96,
  strokeWidth = 10,
  label,
  valueLabel,
  className,
}: RingProgressProps) {
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));
  const data = [{ value: safeValue }];

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          cx="50%"
          cy="50%"
          innerRadius={size / 2 - strokeWidth}
          outerRadius={size / 2}
          barSize={strokeWidth}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={strokeWidth / 2}
            fill={ACCENT_COLOR[accent]}
            background={{ fill: ACCENT_TRACK_COLOR[accent] }}
            isAnimationActive
          />
        </RadialBarChart>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
          {value === null ? "-" : (valueLabel ?? `${value.toFixed(1)}%`)}
        </div>
      </div>
      {label && <div className="mt-1 text-xs text-foreground-muted">{label}</div>}
    </div>
  );
}
