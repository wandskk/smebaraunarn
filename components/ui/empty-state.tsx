import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Substitui a caixa tracejada genérica ("Nenhum ponto de atenção...", "Sem
 * dado suficiente...") repetida em várias telas — mesmo texto, agora com
 * ícone e hierarquia visual, sem inventar conteúdo novo. Ver auditoria do
 * ETAPA V0 do plano de redesign.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
