import { cn } from "@/lib/utils";
import type { FaixaFrequencia } from "@/lib/analytics/frequencia";

const FAIXA_LABEL: Record<FaixaFrequencia, string> = {
  adequada: "Adequada",
  atencao: "Atenção",
  critica: "Crítica",
};

const FAIXA_STYLE: Record<FaixaFrequencia, string> = {
  adequada: "bg-emerald-50 text-emerald-700",
  atencao: "bg-amber-50 text-amber-700",
  critica: "bg-red-50 text-red-700",
};

export function FaixaBadge({ faixa }: { faixa: FaixaFrequencia | null }) {
  if (!faixa) return <span className="text-xs text-slate-400">-</span>;
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", FAIXA_STYLE[faixa])}>
      {FAIXA_LABEL[faixa]}
    </span>
  );
}
