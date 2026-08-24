import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getAvaliacoesResumoPorEscola, TIPO_AVALIACAO_LABEL } from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma avaliação com resultados registrados para esta escola ainda.
        </p>
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
                    <Badge variant="neutral">{a.ano}</Badge>
                  </div>
                  <div className="mt-3 font-semibold text-foreground">{a.nome}</div>
                  <div className="mt-0.5 text-xs text-foreground-muted/70">
                    {a.codigo} · {TIPO_AVALIACAO_LABEL[a.tipo]}
                    {a.etapaEnsino && ` · ${a.etapaEnsino}`}
                  </div>
                  <div className="mt-3 text-sm text-foreground-muted">
                    Cobertura: {a.totalResultados}/{a.totalEsperado || "?"}{" "}
                    {percentual !== null && `(${percentual.toFixed(0)}%)`} · {a.turmasComResultado} turma(s)
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
