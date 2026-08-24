import Link from "next/link";
import { BookOpen, CalendarCheck, FileDown } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";

export default async function AlunoHomePage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

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
        description={`Matrícula ${estudante.matricula} · ${estudante.turmaSerie ?? "Turma não informada"} · ${
          estudante.nomeEscola ?? estudante.escola.nome
        }`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-card"
          >
            <card.icon className="mb-3 h-6 w-6 text-primary" />
            <div className="font-semibold text-foreground">{card.label}</div>
            <div className="mt-1 text-sm text-foreground-muted">{card.desc}</div>
          </Link>
        ))}
      </div>

      <SectionCard title="Dados do Responsável" className="mt-8">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
      </SectionCard>
    </div>
  );
}
