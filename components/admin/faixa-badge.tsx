import type { BadgeVariant } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import type { FaixaFrequencia } from "@/lib/analytics/frequencia";

const FAIXA_LABEL: Record<FaixaFrequencia, string> = {
  adequada: "Adequada",
  atencao: "Atenção",
  critica: "Crítica",
};

const FAIXA_VARIANT: Record<FaixaFrequencia, BadgeVariant> = {
  adequada: "success",
  atencao: "warning",
  critica: "danger",
};

export function FaixaBadge({ faixa }: { faixa: FaixaFrequencia | null }) {
  if (!faixa) return <span className="text-xs text-foreground-muted/60">-</span>;
  return <Badge variant={FAIXA_VARIANT[faixa]}>{FAIXA_LABEL[faixa]}</Badge>;
}
