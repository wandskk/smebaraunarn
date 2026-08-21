import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger" | "education";

const VARIANT_STYLE: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  info: "bg-info-subtle text-info-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  danger: "bg-danger-subtle text-danger-subtle-foreground",
  education: "bg-education-subtle text-education-subtle-foreground",
};

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  icon?: LucideIcon;
  /** Texto do estado — obrigatório: nunca comunicar estado só pela cor/ícone. */
  children: ReactNode;
}

/**
 * Estado sempre comunicado por texto (e opcionalmente ícone), nunca só pela
 * cor — importante para leitura em daltonismo e para reforçar significado.
 */
export function Badge({ variant = "neutral", icon: Icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANT_STYLE[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
