"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
}

/** Campo de busca padrão das listagens: atualiza a URL com debounce e reseta a página para 1. */
export function SearchInput({ placeholder = "Buscar...", paramName = "q" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Só ressincroniza a partir da URL quando o campo não está em foco — evita apagar o que
  // o usuário está digitando caso uma navegação anterior ainda esteja em andamento.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  useEffect(() => {
    const current = searchParams.get(paramName) ?? "";
    if (value === current) return;

    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(paramName, value);
      else params.delete(paramName);
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
    />
  );
}
