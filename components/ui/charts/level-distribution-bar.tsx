import { cn } from "@/lib/utils";
import { ACCENT_COLOR, type ChartAccent } from "./accent-colors";

export interface LevelDistributionDatum {
  label: string;
  /** Omitido quando a fonte só tem o percentual médio entre turmas, sem contagem real de estudante por nível (ver ResumoResultadosTurma) — nunca estimado a partir do percentual pra não inventar precisão que a fonte não tem. */
  quantidade?: number;
  percentual: number;
  accent: ChartAccent;
}

export interface LevelDistributionBarProps {
  data: LevelDistributionDatum[];
  className?: string;
}

/**
 * Barra única dividida em segmentos proporcionais (% de estudantes por
 * nível de aprendizagem) + legenda — mesma leitura da distribuição em 3
 * níveis do portal CAEd (Defasagem/Intermediário/Adequado), mas genérica o
 * bastante pra qualquer taxonomia com 2+ níveis. CSS puro (sem recharts):
 * é só uma barra de proporção, não precisa de eixo/tooltip/animação.
 */
export function LevelDistributionBar({ data, className }: LevelDistributionBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
        {data
          .filter((d) => d.percentual > 0)
          .map((d) => (
            <div key={d.label} style={{ width: `${d.percentual}%`, backgroundColor: ACCENT_COLOR[d.accent] }} title={`${d.label}: ${d.percentual.toFixed(0)}%`} />
          ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT_COLOR[d.accent] }} />
            <span className="text-foreground-muted">{d.label}</span>
            {d.quantidade !== undefined && <span className="font-medium text-foreground">{d.quantidade} estudante(s)</span>}
            <span className="font-medium text-foreground">{d.percentual.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
