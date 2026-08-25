import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Linha curta de contexto (ex.: "Ano letivo 2026 · última atualização X"). */
  metadata?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

/** Cabeçalho padrão de página administrativa: título, descrição, metadados e ações. */
export function PageHeader({ title, description, metadata, actions, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {breadcrumbs && <div className="mb-2 text-sm">{breadcrumbs}</div>}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
        {metadata && <div className="mt-2 text-xs text-foreground-muted">{metadata}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
