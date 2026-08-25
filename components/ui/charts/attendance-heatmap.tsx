import { formatarDataIso } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export type HeatmapIntensidade = "vazio" | "boa" | "atencao" | "critica";

export interface AttendanceHeatmapDay {
  /** ISO yyyy-mm-dd. */
  data: string;
  intensidade: HeatmapIntensidade;
  /** Texto do tooltip nativo (title) — ex. "18/03/2026 — 1 falta de 4 aulas". */
  tooltip?: string;
}

export interface AttendanceHeatmapProps {
  /** Dias em ordem cronológica — quem chama já decide o recorte (mês, período custom). */
  dias: AttendanceHeatmapDay[];
  className?: string;
}

const INTENSIDADE_STYLE: Record<HeatmapIntensidade, string> = {
  vazio: "bg-surface-muted",
  boa: "bg-success",
  atencao: "bg-warning",
  critica: "bg-danger",
};

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Grade de calendário estilo "GitHub contributions" para presença/falta
 * diária — o dado que hoje só vira um percentual agregado (ex.: "87%
 * frequência") ganha aqui o padrão por trás do número (ex.: faltas
 * concentradas numa segunda-feira). Sem recharts (a lib não tem heatmap de
 * calendário) — grade CSS pura, Server Component. Nenhuma interatividade
 * além do `title` nativo por célula (acessível, sem JS). Ver ETAPA V0 do
 * plano de redesign.
 */
export function AttendanceHeatmap({ dias, className }: AttendanceHeatmapProps) {
  if (dias.length === 0) return null;

  // T00:00:00 força parse no fuso local — mesma convenção de lib/format-date.ts.
  const primeiroDiaSemana = new Date(`${dias[0]!.data}T00:00:00`).getDay();
  const celulasVazias: null[] = Array.from({ length: primeiroDiaSemana }, () => null);
  const celulas: (AttendanceHeatmapDay | null)[] = [...celulasVazias, ...dias];

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((rotulo, index) => (
          <div key={index} className="flex h-4 w-4 items-center justify-center text-[10px] text-foreground-muted/60">
            {rotulo}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celulas.map((dia, index) =>
          dia === null ? (
            <div key={`vazio-${index}`} className="h-4 w-4" />
          ) : (
            <div
              key={dia.data}
              title={dia.tooltip ?? formatarDataIso(dia.data)}
              className={cn("h-4 w-4 rounded-sm", INTENSIDADE_STYLE[dia.intensidade])}
            />
          ),
        )}
      </div>
    </div>
  );
}
