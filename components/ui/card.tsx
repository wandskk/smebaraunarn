import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Aplica hover discreto — usar apenas quando o card inteiro for clicável (ex.: envolto em Link). */
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        interactive && "transition hover:border-primary/40 hover:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Card com cabeçalho padrão (título + descrição + ações) para seções de página. */
export function SectionCard({ title, description, actions, className, children, ...props }: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5", className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
