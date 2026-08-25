import Link from "next/link";
import type { ReactNode } from "react";
import { Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/charts/sparkline";

export type MetricCardTone = "default" | "atencao" | "critico";

/**
 * Cor de domínio do indicador (Fase 7 — "linguagem visual própria" pedida
 * pelo cliente: aprendizagem em violeta, frequência em ciano, etc.). Só se
 * aplica quando tone="default" — um alerta real (atencao/critico) sempre
 * tem prioridade visual sobre a cor decorativa de domínio.
 */
export type MetricCardAccent = "primary" | "success" | "warning" | "info" | "education" | "attendance";

const ACCENT_STYLE: Record<MetricCardAccent, { icon: string; iconBg: string }> = {
  primary: { icon: "text-primary", iconBg: "bg-primary-subtle" },
  success: { icon: "text-success", iconBg: "bg-success-subtle" },
  warning: { icon: "text-warning", iconBg: "bg-warning-subtle" },
  info: { icon: "text-info", iconBg: "bg-info-subtle" },
  education: { icon: "text-education", iconBg: "bg-education-subtle" },
  attendance: { icon: "text-attendance", iconBg: "bg-attendance-subtle" },
};

const TONE_OVERRIDE_STYLE: Partial<Record<MetricCardTone, { icon: string; iconBg: string }>> = {
  atencao: { icon: "text-warning", iconBg: "bg-warning-subtle" },
  critico: { icon: "text-danger", iconBg: "bg-danger-subtle" },
};

export interface MetricCardProps {
  label: string;
  /** String na maioria dos usos; aceita ReactNode para casos como AnimatedNumber. */
  value: ReactNode;
  icon: LucideIcon;
  /** Contexto curto sob o valor (ex.: link textual para o detalhe). */
  helpText?: string;
  /**
   * Texto de explicabilidade (fonte, fórmula, data de atualização) exibido
   * como tooltip nativo — ver lib/analytics/explicabilidade.ts. Todo
   * indicador relevante deveria ter um.
   */
  explicacao?: string;
  href?: string;
  tone?: MetricCardTone;
  /** Cor de domínio do ícone quando tone="default" (ver MetricCardAccent). */
  accent?: MetricCardAccent;
  /**
   * Série curta (ex.: percentual diário dos últimos 30 dias) exibida como
   * sparkline embutido — opcional e aditivo, nenhum uso existente do
   * MetricCard precisa passar isso. Ver ETAPA V0 do plano de redesign.
   */
  trend?: number[];
}

/**
 * Evolução visual do KpiCard (components/admin/kpi-card.tsx), com a mesma
 * API — pensada para substituir esse componente página a página nas fases
 * seguintes do redesign, sem qualquer mudança de dado ou comportamento.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  helpText,
  explicacao,
  href,
  tone = "default",
  accent = "primary",
  trend,
}: MetricCardProps) {
  const { icon: iconStyle, iconBg } = TONE_OVERRIDE_STYLE[tone] ?? ACCENT_STYLE[accent];
  const sparklineAccent = tone === "atencao" ? "warning" : tone === "critico" ? "danger" : accent;

  const conteudo = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconStyle)} />
        </span>
        <div className="flex items-center gap-2">
          {trend && trend.length > 1 && (
            <Sparkline data={trend} accent={sparklineAccent} height={28} className="w-16" />
          )}
          {explicacao && (
            <span
              title={explicacao}
              aria-label={explicacao}
              tabIndex={0}
              className="text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 rounded"
            >
              <Info className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-foreground-muted">{label}</div>
      {helpText && <div className="mt-1.5 text-xs text-foreground-muted">{helpText}</div>}
    </>
  );

  const baseClassName = "block rounded-xl border border-border bg-surface p-5";

  if (href) {
    return (
      <Link href={href} className={cn(baseClassName, "transition hover:border-primary/40 hover:shadow-card")}>
        {conteudo}
      </Link>
    );
  }

  return <div className={baseClassName}>{conteudo}</div>;
}
