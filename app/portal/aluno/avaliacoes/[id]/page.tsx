import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { getAvaliacoesResultadosPorEstudante, TIPO_AVALIACAO_LABEL, NIVEL_FLUENCIA_LABEL } from "@/lib/queries/avaliacoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Award, ClipboardCheck, Gauge } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default async function AlunoAvaliacaoDetalhePage({ params }: PageProps) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  // Escopo travado: só os próprios resultados — nunca busca direto por
  // avaliacaoId sem filtrar por este estudante.
  const resultados = await getAvaliacoesResultadosPorEstudante(estudante.id);
  const resultado = resultados.find((r) => r.avaliacaoId === params.id);
  if (!resultado) notFound();

  // Evolução pessoal: outras aplicações do mesmo tipo, para comparação ao
  // longo do tempo — nunca comparação com outros estudantes.
  const outrasDoMesmoTipo = resultados
    .filter((r) => r.tipo === resultado.tipo && r.avaliacaoId !== resultado.avaliacaoId)
    .sort((a, b) => a.ano - b.ano);

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/portal/aluno/avaliacoes" className="text-primary hover:underline">
            ← Avaliações Municipais
          </Link>
        }
        title={resultado.nome}
        description={`${TIPO_AVALIACAO_LABEL[resultado.tipo]} · ${resultado.ano}${resultado.etapaEnsino ? ` · ${resultado.etapaEnsino}` : ""}`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {resultado.pontuacao !== null && (
          <MetricCard label="Pontuação" value={String(resultado.pontuacao)} icon={ClipboardCheck} accent="info" />
        )}
        {resultado.nivelDesempenho && (
          <MetricCard
            label="Nível"
            value={NIVEL_FLUENCIA_LABEL[resultado.nivelDesempenho]}
            icon={Award}
            accent="education"
          />
        )}
        {resultado.palavrasPorMin !== null && (
          <MetricCard
            label="Palavras por minuto"
            value={String(resultado.palavrasPorMin)}
            icon={Gauge}
            accent="attendance"
          />
        )}
      </div>

      {resultado.observacoes && (
        <Card className="mt-6">
          <div className="text-xs uppercase text-foreground-muted">Observações</div>
          <p className="mt-1 text-sm text-foreground">{resultado.observacoes}</p>
        </Card>
      )}

      {outrasDoMesmoTipo.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-foreground">
            Sua evolução em {TIPO_AVALIACAO_LABEL[resultado.tipo]}
          </h2>
          <div className="mt-3 space-y-2">
            {[...outrasDoMesmoTipo, resultado]
              .sort((a, b) => a.ano - b.ano)
              .map((r) => (
                <div
                  key={r.avaliacaoId}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                    r.avaliacaoId === resultado.avaliacaoId ? "border-primary/40 bg-primary-subtle" : "border-border bg-surface"
                  }`}
                >
                  <span className="text-foreground-muted">
                    {r.ano} · {r.nome}
                  </span>
                  <span className="font-medium text-foreground">
                    {r.nivelDesempenho ? NIVEL_FLUENCIA_LABEL[r.nivelDesempenho] : (r.pontuacao ?? "-")}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      <p className="mt-8 text-xs text-foreground-muted/70">
        Atualizado em {format(resultado.atualizadoEm, "dd/MM/yyyy", { locale: ptBR })}. Este resultado é individual —
        não há comparação com outros estudantes nesta tela.
      </p>
    </div>
  );
}
