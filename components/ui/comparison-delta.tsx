import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export interface ComparisonDeltaProps {
  /** Diferença numérica bruta — define o sinal exibido (seta para cima/baixo). */
  diferenca: number;
  /** Texto já formatado ao lado do ícone (ex.: "+2.3 p.p. da rede", "-1.1 p.p."). */
  texto: string;
  /**
   * Se esta diferença é favorável (verde) ou não (vermelho); `null` trata a
   * variação como estável (cinza, sem seta de tendência). Fica a cargo de
   * quem chama decidir o que é "favorável" e o limiar de estabilidade — ex.:
   * frequência/desempenho acima da referência é bom, distorção idade-série
   * acima é ruim. `ComparisonDelta` não assume isso, só renderiza.
   */
  favoravel: boolean | null;
}

/**
 * Indicador de variação (seta + texto colorido) compartilhado entre
 * `/admin/indicadores/frequencia` (variação temporal: período atual vs.
 * anterior) e `/admin/indicadores/comparativos` (variação espacial: escola
 * vs. rede) — antes da ETAPA 03 cada página tinha sua própria cópia quase
 * idêntica deste componente. A classificação (o que conta como "favorável"
 * e o limiar de estabilidade) permanece em cada página/módulo de análise,
 * só a apresentação foi consolidada.
 */
export function ComparisonDelta({ diferenca, texto, favoravel }: ComparisonDeltaProps) {
  if (favoravel === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-foreground-muted/60">
        <Minus className="h-3.5 w-3.5" /> {texto}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${favoravel ? "text-success" : "text-danger"}`}>
      {diferenca > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {texto}
    </span>
  );
}
