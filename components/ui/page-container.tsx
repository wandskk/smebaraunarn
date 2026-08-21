import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Largura máxima e centralização padrão do conteúdo das páginas administrativas. */
export function PageContainer({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl", className)} {...props}>
      {children}
    </div>
  );
}
