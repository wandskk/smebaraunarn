import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getAvaliacoesResumoPorEscola, TIPO_AVALIACAO_LABEL, STATUS_AVALIACAO_LABEL } from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RingProgress } from "@/components/ui/charts/ring-progress";

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

export default async function DirecaoAvaliacoesPage() {
  const session = await requireSession(["DIRETOR"]);
  const avaliacoes = await getAvaliacoesResumoPorEscola(session.escolaId!);

  return (
    <div>
      <PageHeader
        title="Avaliações Municipais"
        description="Catálogo das avaliações aplicadas à sua escola, com cobertura por turma."
      />

      {avaliacoes.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ClipboardList}
          title="Nenhuma avaliação com resultado"
          description="Nenhuma avaliação com resultados registrados para esta escola ainda."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {avaliacoes.map((a) => {
            const percentual = a.totalEsperado > 0 ? (a.totalResultados / a.totalEsperado) * 100 : null;
            return (
              <Link
                key={a.avaliacaoId}
                href={`/portal/direcao/avaliacoes/${a.avaliacaoId}`}
                className="block transition hover:shadow-card"
              >
                <Card interactive>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info">
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="neutral">{a.ano}</Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[a.status]}>{STATUS_AVALIACAO_LABEL[a.status]}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 font-semibold text-foreground">{a.nome}</div>
                  <div className="mt-0.5 text-xs text-foreground-muted/70">
                    {a.codigo} · {TIPO_AVALIACAO_LABEL[a.tipo]}
                    {a.etapaEnsino && ` · ${a.etapaEnsino}`}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
                    {percentual !== null && <RingProgress value={percentual} accent="info" size={28} strokeWidth={4} valueLabel="" />}
                    <span>
                      Cobertura: {a.totalResultados}/{a.totalEsperado || "?"}{" "}
                      {percentual !== null && `(${percentual.toFixed(0)}%)`} · {a.turmasComResultado} turma(s)
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-foreground-muted/70">
                    Atualizado em {format(a.ultimaAtualizacao, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
