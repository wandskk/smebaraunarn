"use client";

import { useEffect, useRef, useState } from "react";

export interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
}

const formatarPtBr = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

/**
 * Conta de 0 até `value` ao montar — só polimento visual do dashboard, nunca
 * a fonte da verdade do número (o valor final é sempre `value`, o mesmo que
 * apareceria sem animação). Formata em pt-BR internamente (mesma regra de
 * lib/utils.ts:formatNumber) em vez de aceitar uma função como prop — este
 * componente é sempre renderizado a partir de Server Components, e uma
 * função não pode atravessar essa fronteira como prop de Client Component.
 * Desativado por `prefers-reduced-motion` (mostra o valor final direto, sem
 * contagem). Ver ETAPA V0 do plano de redesign.
 */
export function AnimatedNumber({ value, durationMs = 700 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <>{formatarPtBr(display)}</>;
}
