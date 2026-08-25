import { formatarDataIso } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export type HeatmapIntensidade = "vazio" | "boa" | "atencao" | "critica";

export interface AttendanceHeatmapDatum {
  intensidade: HeatmapIntensidade;
  /** Texto do tooltip nativo (title) — ex. "1 falta de 4 aulas". Se omitido, mostra só a data. */
  tooltip?: string;
}

export interface AttendanceHeatmapProps {
  /** ISO yyyy-mm-dd, inclusive nas duas pontas — mesma convenção de JanelaDias (lib/analytics/frequencia.ts). */
  inicio: string;
  fim: string;
  /** Dado por dia, indexado por ISO yyyy-mm-dd. Dia sem entrada aqui renderiza "vazio" — nunca inventa dado ausente. */
  dados: Record<string, AttendanceHeatmapDatum>;
  className?: string;
}

const INTENSIDADE_STYLE: Record<HeatmapIntensidade, string> = {
  vazio: "bg-surface-muted",
  boa: "bg-success",
  atencao: "bg-warning",
  critica: "bg-danger",
};

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Formato ISO yyyy-mm-dd a partir de aritmética em UTC — mesma convenção de calcularJanelaDias. */
function paraIsoUtc(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/**
 * Grade de calendário estilo "GitHub contributions" para presença/falta
 * diária — o dado que hoje só vira um percentual agregado (ex.: "87%
 * frequência") ganha aqui o padrão por trás do número (ex.: faltas
 * concentradas numa segunda-feira). Itera dia a dia entre `inicio` e `fim`
 * (aritmética em UTC, como `calcularJanelaDias`) em vez de assumir que
 * `dados` vem sem lacunas — frequência real tem fim de semana/feriado sem
 * registro, e pular esses dias sem contar quebraria o alinhamento da
 * coluna de dia da semana. Sem recharts (a lib não tem heatmap de
 * calendário) — grade CSS pura, Server Component. Nenhuma interatividade
 * além do `title` nativo por célula (acessível, sem JS). Ver ETAPA V0/V5
 * do plano de redesign.
 */
export function AttendanceHeatmap({ inicio, fim, dados, className }: AttendanceHeatmapProps) {
  const inicioMs = new Date(`${inicio}T00:00:00Z`).getTime();
  const fimMs = new Date(`${fim}T00:00:00Z`).getTime();
  if (!Number.isFinite(inicioMs) || !Number.isFinite(fimMs) || inicioMs > fimMs) return null;

  const celulasVazias: null[] = Array.from({ length: new Date(inicioMs).getUTCDay() }, () => null);
  const dias: { iso: string; datum: AttendanceHeatmapDatum }[] = [];
  for (let t = inicioMs; t <= fimMs; t += 24 * 60 * 60 * 1000) {
    const iso = paraIsoUtc(new Date(t));
    dias.push({ iso, datum: dados[iso] ?? { intensidade: "vazio" } });
  }

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
        {celulasVazias.map((_, index) => (
          <div key={`vazio-${index}`} className="h-4 w-4" />
        ))}
        {dias.map(({ iso, datum }) => (
          <div
            key={iso}
            title={datum.tooltip ?? formatarDataIso(iso)}
            className={cn("h-4 w-4 rounded-sm", INTENSIDADE_STYLE[datum.intensidade])}
          />
        ))}
      </div>
    </div>
  );
}
