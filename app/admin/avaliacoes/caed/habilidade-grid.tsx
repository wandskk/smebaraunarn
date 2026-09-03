import { faixaAcertoHabilidade } from "@/lib/analytics/avaliacoes";
import { ACCENT_COLOR, ACCENT_TRACK_COLOR, type ChartAccent } from "@/components/ui/charts/accent-colors";
import { cn } from "@/lib/utils";

const LEGENDA: { faixa: string; accent: ChartAccent }[] = [
  { faixa: "Até 40%", accent: "danger" },
  { faixa: "De 41 até 60%", accent: "warning" },
  { faixa: "De 61 até 80%", accent: "info" },
  { faixa: "Acima de 80%", accent: "success" },
];

export interface HabilidadeGridProps {
  porHabilidade: { habilidade: string; percentualMedioAcerto: number }[];
  className?: string;
}

/** Grade de cartões H01..Hn coloridos por faixa de % de acerto — mesma leitura da tela "Percentual de acerto por habilidade" do CAEd (só o código, sem descrição — ver docs/mapeamento-caed-avaliacoes.md). */
export function HabilidadeGrid({ porHabilidade, className }: HabilidadeGridProps) {
  if (porHabilidade.length === 0) {
    return <p className="text-sm text-foreground-muted">Sem dados de acerto por habilidade para esta avaliação.</p>;
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {porHabilidade.map((h) => {
          const accent = faixaAcertoHabilidade(h.percentualMedioAcerto);
          return (
            <div
              key={h.habilidade}
              className="rounded-lg p-3 text-center"
              style={{ backgroundColor: ACCENT_TRACK_COLOR[accent] }}
            >
              <div className="text-xs font-medium" style={{ color: ACCENT_COLOR[accent] }}>
                {h.habilidade}
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">{h.percentualMedioAcerto.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
        {LEGENDA.map((l) => (
          <span key={l.faixa} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full")} style={{ backgroundColor: ACCENT_COLOR[l.accent] }} />
            {l.faixa}
          </span>
        ))}
      </div>
    </div>
  );
}
