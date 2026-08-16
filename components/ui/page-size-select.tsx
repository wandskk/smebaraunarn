"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

interface PageSizeSelectProps {
  paramName?: string;
  options?: readonly number[];
  defaultValue?: number;
}

/** Seletor de "itens por página" padrão das listagens: atualiza a URL e reseta a página para 1. */
export function PageSizeSelect({
  paramName = "pageSize",
  options = PAGE_SIZE_OPTIONS,
  defaultValue = DEFAULT_PAGE_SIZE,
}: PageSizeSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = Number(searchParams.get(paramName)) || defaultValue;

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
      Itens por página
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(paramName, e.target.value);
          params.delete("page");
          startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
          });
        }}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
