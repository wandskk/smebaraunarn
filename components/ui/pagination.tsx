import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}

/** Navegação de páginas padrão das listagens, preservando os demais parâmetros da URL (busca, itens por página, filtros). */
export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefForPage(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (typeof value === "string" && value) params.set(key, value);
    }
    params.set("page", String(target));
    return `${basePath}?${params.toString()}`;
  }

  const pages = getPageRange(page, totalPages);

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
      <Link
        href={hrefForPage(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        className={cn(
          "flex h-9 items-center rounded-lg border px-3 text-sm",
          page === 1
            ? "pointer-events-none border-slate-200 text-slate-300"
            : "border-slate-300 text-slate-600 hover:border-brand-400",
        )}
      >
        Anterior
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefForPage(p)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border text-sm",
              page === p
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 text-slate-600 hover:border-brand-400",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={hrefForPage(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        className={cn(
          "flex h-9 items-center rounded-lg border px-3 text-sm",
          page === totalPages
            ? "pointer-events-none border-slate-200 text-slate-300"
            : "border-slate-300 text-slate-600 hover:border-brand-400",
        )}
      >
        Próxima
      </Link>
    </nav>
  );
}

function getPageRange(current: number, total: number): (number | "...")[] {
  const delta = 1;
  const range: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}
