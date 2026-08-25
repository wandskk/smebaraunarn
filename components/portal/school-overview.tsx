import type { ComparativoEscola } from "@/lib/queries/comparativos";
import { Card } from "@/components/ui/card";
import { ComparisonDelta } from "@/components/ui/comparison-delta";
import { FaixaBadge } from "@/components/admin/faixa-badge";
import { RingProgress } from "@/components/ui/charts/ring-progress";

function formatarPercentual(valor: number | null): string {
  return valor === null ? "-" : `${valor.toFixed(1)}%`;
}

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

/** Mesma leitura de favorabilidade usada em /admin/indicadores/comparativos: distorção inverte o sinal. */
function DiferencaRede({
  diferenca,
  unidade,
  maiorEhMelhor,
}: {
  diferenca: number | null;
  unidade: "p.p." | "pts";
  maiorEhMelhor: boolean;
}) {
  if (diferenca === null) return <span className="text-xs text-foreground-muted/60">sem referência de rede</span>;
  const estavel = Math.abs(diferenca) < 0.05;
  const favoravel = estavel ? null : maiorEhMelhor ? diferenca > 0 : diferenca < 0;
  const texto = `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)} ${unidade} da rede`;
  return <ComparisonDelta diferenca={diferenca} texto={texto} favoravel={favoravel} />;
}

export interface SchoolOverviewProps {
  /** `null` quando a escola não tem dado suficiente para comparar com a rede no ano letivo. */
  comparativo: ComparativoEscola | null;
  anoLetivo: number;
}

/**
 * Núcleo de "como está esta escola frente à rede" — frequência, desempenho
 * e distorção idade-série, cada um com o valor da escola e a diferença para
 * a referência de rede no mesmo recorte temporal (`getComparativosPorEscola`,
 * ETAPA 03/04). Usado por `/admin/escolas/[id]` (Admin escolhe a escola) e
 * pela Home da Direção (`SchoolScope` — escola fixa na sessão), garantindo
 * que "frequência da escola" e "desempenho da escola" signifiquem
 * exatamente a mesma coisa nos dois perfis (ver decisão arquitetural na
 * Tabela 9 do documento de Diretor — ETAPA 05).
 */
export function SchoolOverview({ comparativo, anoLetivo }: SchoolOverviewProps) {
  if (!comparativo) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
        Sem dado suficiente para comparar esta escola com a rede no ano letivo {anoLetivo}.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <div className="text-xs uppercase text-foreground-muted">Frequência</div>
        <div className="mt-2 flex items-center gap-3">
          {comparativo.frequenciaPercentual !== null && (
            <RingProgress value={comparativo.frequenciaPercentual} accent="attendance" size={44} strokeWidth={6} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-foreground">
                {formatarPercentual(comparativo.frequenciaPercentual)}
              </span>
              {comparativo.frequenciaFaixa && <FaixaBadge faixa={comparativo.frequenciaFaixa} />}
            </div>
            <DiferencaRede diferenca={comparativo.frequenciaDiferencaRede} unidade="p.p." maiorEhMelhor />
          </div>
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase text-foreground-muted">Desempenho</div>
        <div className="mt-1 text-xl font-semibold text-foreground">{formatarNota(comparativo.desempenhoMedia)}</div>
        <div className="mt-1">
          <DiferencaRede diferenca={comparativo.desempenhoDiferencaRede} unidade="pts" maiorEhMelhor />
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase text-foreground-muted">Distorção idade-série</div>
        <div className="mt-2 flex items-center gap-3">
          {comparativo.distorcaoPercentual !== null && (
            <RingProgress value={comparativo.distorcaoPercentual} accent="warning" size={44} strokeWidth={6} />
          )}
          <div>
            <div className="text-xl font-semibold text-foreground">
              {formatarPercentual(comparativo.distorcaoPercentual)}
            </div>
            <DiferencaRede diferenca={comparativo.distorcaoDiferencaRede} unidade="p.p." maiorEhMelhor={false} />
          </div>
        </div>
      </Card>
    </div>
  );
}
