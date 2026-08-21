import Link from "next/link";
import { Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricCardTone = "default" | "atencao" | "critico";

const TONE_STYLE: Record<MetricCardTone, { icon: string; iconBg: string }> = {
  default: { icon: "text-primary", iconBg: "bg-primary-subtle" },
  atencao: { icon: "text-warning", iconBg: "bg-warning-subtle" },
  critico: { icon: "text-danger", iconBg: "bg-danger-subtle" },
};

export interface MetricCardProps {
  label: string;
  value: string;
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
}

/**
 * Evolução visual do KpiCard (components/admin/kpi-card.tsx), com a mesma
 * API — pensada para substituir esse componente página a página nas fases
 * seguintes do redesign, sem qualquer mudança de dado ou comportamento.
 */
export function MetricCard({ label, value, icon: Icon, helpText, explicacao, href, tone = "default" }: MetricCardProps) {
  const { icon: iconStyle, iconBg } = TONE_STYLE[tone];

  const conteudo = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconStyle)} />
        </span>
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
