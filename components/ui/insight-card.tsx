import Link from "next/link";
import { AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import type { CategoriaInsight, InsightAtencao } from "@/lib/analytics/atencao";
import { cn } from "@/lib/utils";

export interface InsightCardProps {
  insight: InsightAtencao;
}

const CATEGORIA_LABEL: Record<CategoriaInsight, string> = {
  frequencia: "Frequência",
  aprendizagem: "Aprendizagem",
  trajetoria: "Trajetória",
  dados: "Qualidade dos dados",
};

/** CTA por categoria (seção 4 do plano) — "Investigar escola", "Ver desempenho", etc. */
const CATEGORIA_CTA: Record<CategoriaInsight, string> = {
  frequencia: "Investigar escola",
  aprendizagem: "Ver desempenho",
  trajetoria: "Ver trajetória",
  dados: "Ver sincronização",
};

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
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted/70">
            {CATEGORIA_LABEL[insight.categoria]} · {critico ? "Crítico" : "Atenção"}
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-medium",
              critico ? "text-danger-subtle-foreground" : "text-warning-subtle-foreground",
            )}
          >
            {insight.titulo}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">{insight.motivo}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-foreground-muted/70">{insight.periodo}</p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-xs font-medium",
                critico ? "text-danger" : "text-warning",
              )}
            >
              {CATEGORIA_CTA[insight.categoria]}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
