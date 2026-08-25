import Link from "next/link";
import { BookOpen, CalendarCheck, ChevronDown, ClipboardList, FileDown } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { calcularJanelaDias, calcularPercentualFrequencia } from "@/lib/analytics/frequencia";
import { getAvaliacoesResultadosPorEstudante, TIPO_AVALIACAO_LABEL } from "@/lib/queries/avaliacoes";
import { getStatusSincronizacao } from "@/lib/queries/qualidade-dados";
import { formatarDataIso } from "@/lib/format-date";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";

const DIAS_RESUMO_HOME = 30;

export default async function AlunoHomePage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const anoAtual = new Date().getFullYear();
  const janela = calcularJanelaDias(new Date(), DIAS_RESUMO_HOME);

  const [registrosFrequencia, notasAnoAtual, avaliacoes, { modulos }] = await Promise.all([
    prisma.frequenciaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, data: { gte: janela.inicio, lte: janela.fim } },
      select: { falta: true, quantidadeAula: true },
    }),
    prisma.notaEstudante.findMany({
      where: { estudanteMatricula: estudante.matricula, ano: anoAtual },
      select: { disciplina: true },
    }),
    getAvaliacoesResultadosPorEstudante(estudante.id),
    getStatusSincronizacao(),
  ]);

  const totalAulas = registrosFrequencia.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = registrosFrequencia.reduce((sum, r) => sum + r.falta, 0);
  const percentualFrequencia = calcularPercentualFrequencia(totalAulas, totalFaltas);
  const disciplinasComNota = new Set(notasAnoAtual.map((n) => n.disciplina)).size;
  const ultimaAvaliacao = avaliacoes[0] ?? null;

  const freshnessFrequencia = modulos.find((m) => m.modulo === "FREQUENCIA");
  const freshnessNotas = modulos.find((m) => m.modulo === "NOTAS");

  const cards = [
    {
      href: "/portal/aluno/boletim",
      label: "Boletim Escolar",
      desc: "Consulte suas notas por disciplina e bimestre.",
      icon: BookOpen,
    },
    {
      href: "/portal/aluno/frequencia",
      label: "Frequência",
      desc: "Acompanhe faltas e presenças registradas.",
      icon: CalendarCheck,
    },
    {
      href: "/portal/aluno/avaliacoes",
      label: "Avaliações Municipais",
      desc: "Veja seus resultados de Fluência, SPADEB e simulados.",
      icon: ClipboardList,
    },
    {
      href: "/portal/aluno/declaracao",
      label: "Declaração de Matrícula",
      desc: "Baixe o documento oficial em PDF.",
      icon: FileDown,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${estudante.nome.split(" ")[0]}`}
        description={`${estudante.turmaSerie ?? "Turma não informada"} · ${
          estudante.nomeEscola ?? estudante.escola.nome
        }`}
      />

      <h2 className="mt-6 text-sm font-semibold text-foreground">
        Resumo dos últimos {DIAS_RESUMO_HOME} dias
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-in-up" style={{ "--stagger-delay": "0ms" } as React.CSSProperties}>
          <MetricCard
            href="/portal/aluno/frequencia"
            label="Frequência"
            value={percentualFrequencia !== null ? `${percentualFrequencia.toFixed(1)}%` : "Sem dados no período"}
            icon={CalendarCheck}
            accent="attendance"
          />
        </div>
        <div className="animate-fade-in-up" style={{ "--stagger-delay": "60ms" } as React.CSSProperties}>
          <MetricCard
            href="/portal/aluno/boletim"
            label={`Disciplinas com nota lançada (${anoAtual})`}
            value={<AnimatedNumber value={disciplinasComNota} />}
            icon={BookOpen}
            accent="education"
          />
        </div>
        <div className="animate-fade-in-up" style={{ "--stagger-delay": "120ms" } as React.CSSProperties}>
          <MetricCard
            href="/portal/aluno/avaliacoes"
            label="Última avaliação municipal"
            value={ultimaAvaliacao ? TIPO_AVALIACAO_LABEL[ultimaAvaliacao.tipo] : "Nenhuma ainda"}
            icon={ClipboardList}
            accent="info"
            helpText={ultimaAvaliacao ? `${ultimaAvaliacao.nome} · ${ultimaAvaliacao.ano}` : undefined}
          />
        </div>
      </div>

      {(freshnessFrequencia || freshnessNotas) && (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
          {freshnessFrequencia && (
            <span className="inline-flex items-center gap-1.5">
              Frequência <DataFreshnessBadge situacao={freshnessFrequencia.situacao} />
            </span>
          )}
          {freshnessNotas && (
            <span className="inline-flex items-center gap-1.5">
              Notas <DataFreshnessBadge situacao={freshnessNotas.situacao} />
            </span>
          )}
        </p>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Atalhos</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-card animate-fade-in-up"
            style={{ "--stagger-delay": `${index * 50}ms` } as React.CSSProperties}
          >
            <card.icon className="mb-3 h-6 w-6 text-primary" />
            <div className="font-semibold text-foreground">{card.label}</div>
            <div className="mt-1 text-sm text-foreground-muted">{card.desc}</div>
          </Link>
        ))}
      </div>

      {/* Dados cadastrais de baixo valor para o dia a dia (NIS, filiação) ficam
          recolhidos por padrão — a Home prioriza a situação acadêmica, não o
          cadastro (achado P1 do documento de Aluno). */}
      <details className="mt-8 rounded-xl border border-border bg-surface p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
          Dados cadastrais
          <ChevronDown className="h-4 w-4 text-foreground-muted" />
        </summary>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">Matrícula</dt>
            <dd className="text-foreground">{estudante.matricula}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Responsável</dt>
            <dd className="text-foreground">{estudante.nomeResponsavel ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Filiação 1</dt>
            <dd className="text-foreground">{estudante.nomeFiliacao1 ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Filiação 2</dt>
            <dd className="text-foreground">{estudante.nomeFiliacao2 ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">NIS</dt>
            <dd className="text-foreground">{estudante.codigoNis ?? "-"}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
