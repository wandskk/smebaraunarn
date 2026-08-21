import { SearchX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableEmptyStateProps {
  /** Número de colunas da tabela, para o colSpan da célula única. */
  colSpan: number;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Estado vazio padrão de listagens — substitui o `<tr><td colSpan>` repetido em cada tabela. */
export function TableEmptyState({ colSpan, title, description, icon: Icon = SearchX, className }: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn("px-4 py-12 text-center", className)}>
        <Icon className="mx-auto h-8 w-8 text-foreground-muted/40" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-foreground-muted">{title}</p>
        {description && <p className="mt-1 text-xs text-foreground-muted">{description}</p>}
      </td>
    </tr>
  );
}
