"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface NavigationLoadingContextValue {
  start: () => void;
  stop: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

/** Usado por filtros/buscas que navegam via router.push/replace dentro de um useTransition. */
export function useNavigationLoading() {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) throw new Error("useNavigationLoading precisa estar dentro de <NavigationLoadingProvider>");
  return ctx;
}

// Evita o overlay travado ligado caso uma navegação falhe silenciosamente
// (erro de rede, rota redirecionada para fora do app etc.) sem nunca disparar
// a mudança de pathname/searchParams que normalmente o desligaria.
const SAFETY_TIMEOUT_MS = 8000;

/**
 * Overlay global de carregamento (blur + spinner) para toda navegação do App
 * Router: cliques em <a>/<Link> internos (capturados via listener global) e
 * navegações programáticas (router.push/replace) iniciadas por filtros, que
 * chamam `start()` explicitamente. É desligado automaticamente assim que o
 * pathname ou os searchParams mudam, que é quando o Next termina de renderizar
 * o novo segmento.
 */
export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearSafetyTimeout();
    setIsLoading(false);
  }, [clearSafetyTimeout]);

  const start = useCallback(() => {
    setIsLoading(true);
    clearSafetyTimeout();
    timeoutRef.current = setTimeout(stop, SAFETY_TIMEOUT_MS);
  }, [clearSafetyTimeout, stop]);

  useEffect(() => clearSafetyTimeout, [clearSafetyTimeout]);

  useEffect(() => {
    function isModifiedOrNewTabClick(event: MouseEvent) {
      return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedOrNewTabClick(event)) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("href")?.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const isSamePage =
        url.pathname === window.location.pathname && url.search === window.location.search;
      if (isSamePage) return;

      start();
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [start]);

  return (
    <NavigationLoadingContext.Provider value={{ start, stop }}>
      {children}
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={stop} />
      </Suspense>
      <div
        aria-hidden={!isLoading}
        className={`fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm transition-opacity duration-150 ${
          isLoading ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Loader2 className="h-9 w-9 animate-spin text-primary" aria-label="Carregando" />
      </div>
    </NavigationLoadingContext.Provider>
  );
}

// `useSearchParams` exige um limite de Suspense — isolado aqui num componente
// próprio, invisível, para não fazer o app inteiro cair para renderização
// client-side só por causa do overlay de loading.
function RouteChangeWatcher({ onRouteChange }: { onRouteChange: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
