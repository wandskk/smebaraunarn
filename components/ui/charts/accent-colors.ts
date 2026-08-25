/**
 * Cor de accent compartilhada por todos os gráficos recharts do redesign
 * (docs/redesign-visual/PLANO_REDESIGN_VISUAL.md, ETAPA V0). Superset de
 * MetricCardAccent (components/ui/metric-card.tsx) incluindo "danger" —
 * gráficos precisam representar estado crítico, o que o KPI card sozinho
 * não precisava até agora.
 *
 * `hsl(var(--x))` funciona direto como fill/stroke de SVG porque os tokens
 * em app/globals.css já estão no formato "H S% L%" (sem o wrapper hsl()) —
 * mesma convenção usada por tailwind.config.ts.
 */
export type ChartAccent = "primary" | "success" | "warning" | "danger" | "info" | "education" | "attendance";

export const ACCENT_COLOR: Record<ChartAccent, string> = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
  info: "hsl(var(--info))",
  education: "hsl(var(--education))",
  attendance: "hsl(var(--attendance))",
};

/** Fundo pastel do mesmo domínio — usado como "trilho" do RingProgress e afins. */
export const ACCENT_TRACK_COLOR: Record<ChartAccent, string> = {
  primary: "hsl(var(--primary-subtle))",
  success: "hsl(var(--success-subtle))",
  warning: "hsl(var(--warning-subtle))",
  danger: "hsl(var(--danger-subtle))",
  info: "hsl(var(--info-subtle))",
  education: "hsl(var(--education-subtle))",
  attendance: "hsl(var(--attendance-subtle))",
};
