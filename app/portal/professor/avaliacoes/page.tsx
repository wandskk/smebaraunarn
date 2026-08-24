import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { getAvaliacoesResumo, TIPO_AVALIACAO_LABEL, STATUS_AVALIACAO_LABEL } from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  preparacao: "neutral",
  em_aplicacao: "info",
  coleta_parcial: "warning",
  consolidada: "success",
};

export default async function ProfessorAvaliacoesPage() {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const atribuicoes = servidor.turmas.map((t) => ({ escolaId: t.escolaId, turma: t.turma }));
  const avaliacoes = await getAvaliacoesResumo({ kind: "professor", atribuicoes });

  return (
    <div>
      <PageHeader
        title="Avaliações Municipais"
        description="Avaliações com resultado registrado em alguma das suas turmas."
      />

      {atribuicoes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Você ainda não tem nenhuma turma vinculada. Assim que a Secretaria confirmar sua atribuição no SIGEduc, as
          avaliações das suas turmas aparecerão aqui.
        </p>
      ) : avaliacoes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma avaliação com resultado registrado em suas turmas ainda.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {avaliacoes.map((a) => (
            <Link
              key={a.avaliacaoId}
              href={`/portal/professor/avaliacoes/${a.avaliacaoId}`}
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
                <div className="mt-3 text-sm text-foreground-muted">
                  Cobertura: {a.totalResultados}/{a.totalEsperado || "?"} · {a.turmasComResultado} turma(s) sua(s)
                </div>
                <div className="mt-1 text-xs text-foreground-muted/70">
                  Atualizado em {format(a.ultimaAtualizacao, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
