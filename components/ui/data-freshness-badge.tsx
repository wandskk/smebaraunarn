import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { SituacaoSincronizacao } from "@/lib/analytics/qualidade-dados";
import { Badge } from "@/components/ui/badge";

const RUBRICA: Record<SituacaoSincronizacao, { label: string; variant: "success" | "warning" | "danger"; icon: typeof CheckCircle2 }> = {
  "em-dia": { label: "Em dia", variant: "success", icon: CheckCircle2 },
  atrasado: { label: "Atrasado", variant: "warning", icon: Clock },
  "sem-sincronizacao": { label: "Sem sincronização", variant: "danger", icon: XCircle },
};

export interface DataFreshnessBadgeProps {
  situacao: SituacaoSincronizacao;
}

/**
 * Badge de frescor de UM módulo/fonte de dados (ver
 * lib/analytics/qualidade-dados.ts:classificarSituacaoSincronizacao). Nunca
 * deve receber "última sincronização de qualquer módulo" — o chamador
 * precisa resolver a situação do módulo específico que o dado exibido
 * realmente depende (regra 7.5 do master prompt).
 */
export function DataFreshnessBadge({ situacao }: DataFreshnessBadgeProps) {
  const { label, variant, icon } = RUBRICA[situacao];
  return (
    <Badge variant={variant} icon={icon}>
      {label}
    </Badge>
  );
}
