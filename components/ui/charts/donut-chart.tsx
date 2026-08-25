"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface DonutChartDatum {
  label: string;
  value: number;
  accent: ChartAccent;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

/**
 * Composição categórica (recharts PieChart com innerRadius) + legenda em
 * texto ao lado — nunca só cor (regra de acessibilidade do plano de
 * redesign, mesma já seguida por components/ui/badge.tsx). Ver ETAPA V0.
 */
export function DonutChart({ data, size = 160, thickness = 22, centerLabel, centerValue, className }: DonutChartProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
          >
            {data.map((d) => (
              <Cell key={d.label} fill={ACCENT_COLOR[d.accent]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              backgroundColor: "hsl(var(--surface))",
            }}
          />
        </PieChart>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <span className="text-lg font-semibold text-foreground">{centerValue}</span>}
            {centerLabel && <span className="text-[11px] text-foreground-muted">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT_COLOR[d.accent] }} />
            <span className="text-foreground-muted">{d.label}</span>
            <span className="font-medium text-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
