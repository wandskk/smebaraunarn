import Link from "next/link";
import { AlertTriangle, AlertCircle } from "lucide-react";
import type { InsightAtencao } from "@/lib/analytics/atencao";
import { cn } from "@/lib/utils";

export interface InsightCardProps {
  insight: InsightAtencao;
}

/**
 * Cartão explicável de um insight de "Atenção agora" — fato + valor já
 * formatados em `insight.titulo`, motivo, período e deep-link para a
 * entidade que explica o valor. Nunca soma insights num score único (regra
 * 7.6 do master prompt); cada cartão é independente e a classificação
 * (crítico/atenção) vem já pronta de `lib/analytics/atencao.ts`.
 */
export function InsightCard({ insight }: InsightCardProps) {
  const critico = insight.severidade === "critico";
  const Icone = critico ? AlertTriangle : AlertCircle;

  return (
    <Link
      href={insight.href}
      className={cn(
        "block rounded-xl border p-4 transition hover:shadow-card",
        critico ? "border-danger/30 bg-danger-subtle" : "border-warning/30 bg-warning-subtle",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            critico ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning",
          )}
        >
          <Icone className="h-4 w-4" />
        </span>
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              critico ? "text-danger-subtle-foreground" : "text-warning-subtle-foreground",
            )}
          >
            {insight.titulo}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">{insight.motivo}</p>
          <p className="mt-1 text-xs text-foreground-muted/70">{insight.periodo}</p>
        </div>
      </div>
    </Link>
  );
}
