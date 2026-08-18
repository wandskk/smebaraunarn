import Link from "next/link";
import { Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiCardTone = "default" | "atencao" | "critico";

const TONE_ICON_STYLE: Record<KpiCardTone, string> = {
  default: "text-brand-600",
  atencao: "text-amber-600",
  critico: "text-red-600",
};

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Contexto curto sob o valor (ex.: comparação com período anterior). */
  helpText?: string;
  /**
   * Texto de explicabilidade (fonte, fórmula, data de atualização) exibido
   * como tooltip nativo — ver lib/analytics/explicabilidade.ts. Todo
   * indicador relevante deveria ter um.
   */
  explicacao?: string;
  href?: string;
  tone?: KpiCardTone;
}

export function KpiCard({ label, value, icon: Icon, helpText, explicacao, href, tone = "default" }: KpiCardProps) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between">
        <Icon className={cn("h-5 w-5", TONE_ICON_STYLE[tone])} />
        {explicacao && (
          <span title={explicacao} aria-label={explicacao} className="text-slate-300 hover:text-slate-500">
            <Info className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {helpText && <div className="mt-1 text-xs text-slate-400">{helpText}</div>}
    </>
  );

  const className = "rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm";

  if (href) {
    return (
      <Link href={href} className={className}>
        {conteudo}
      </Link>
    );
  }

  return <div className={className}>{conteudo}</div>;
}
