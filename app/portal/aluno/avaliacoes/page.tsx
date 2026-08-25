import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { getAvaliacoesResultadosPorEstudante, TIPO_AVALIACAO_LABEL, NIVEL_FLUENCIA_LABEL } from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AlunoAvaliacoesPage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const resultados = await getAvaliacoesResultadosPorEstudante(estudante.id);

  return (
    <div>
      <PageHeader
        title="Avaliações Municipais"
        description="Seus próprios resultados de Fluência Leitora, SPADEB, simulados e provas municipais."
      />

      {resultados.length === 0 ? (
        <EmptyState className="mt-8" icon={ClipboardList} title="Nenhum resultado disponível ainda" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((r) => (
            <Link key={r.id} href={`/portal/aluno/avaliacoes/${r.avaliacaoId}`} className="block">
              <Card interactive>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <Badge variant="neutral">{r.ano}</Badge>
                </div>
                <div className="mt-3 font-semibold text-foreground">{r.nome}</div>
                <div className="mt-0.5 text-xs text-foreground-muted/70">{TIPO_AVALIACAO_LABEL[r.tipo]}</div>
                <div className="mt-3 text-sm text-foreground-muted">
                  {r.nivelDesempenho
                    ? NIVEL_FLUENCIA_LABEL[r.nivelDesempenho]
                    : r.pontuacao !== null
                      ? `Pontuação: ${r.pontuacao}`
                      : "Resultado sem detalhamento"}
                </div>
                <div className="mt-1 text-xs text-foreground-muted/70">
                  Atualizado em {format(r.atualizadoEm, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
