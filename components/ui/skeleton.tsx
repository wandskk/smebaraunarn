import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Bloco base do esqueleto de loading — shimmer definido em app/globals.css (.skeleton-shimmer). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

/** Placeholder de um MetricCard — mesma estrutura visual (ícone + valor + rótulo). */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Placeholder de uma DataTable — linhas de barras em larguras alternadas para não parecer uma grade rígida demais. */
export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className={cn("h-3.5 flex-1", col === 0 && "max-w-[40%]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder de um gráfico (ring/donut/barra) — círculo ou retângulo conforme a forma esperada. */
export function ChartSkeleton({ shape = "rect", size = 160 }: { shape?: "rect" | "circle"; size?: number }) {
  return (
    <Skeleton
      className={shape === "circle" ? "rounded-full" : "w-full rounded-xl"}
      style={{ width: shape === "circle" ? size : undefined, height: size }}
    />
  );
}

/**
 * Esqueleto genérico de um `loading.tsx` de dashboard (título + N cards de
 * métrica + uma tabela) — usado pelos 5 `app/**\/loading.tsx` do redesign.
 * Next.js troca automaticamente por `page.tsx` assim que os dados chegam;
 * não precisa espelhar cada tela pixel a pixel, só a forma geral (título,
 * grid de cards, bloco de tabela) para não haver salto de layout perceptível.
 */
export function DashboardSkeleton({ metricCards = 4 }: { metricCards?: number }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: metricCards }, (_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-8">
        <TableSkeleton />
      </div>
    </div>
  );
}
