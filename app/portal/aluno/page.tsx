import Link from "next/link";
import { BookOpen, CalendarCheck, FileDown } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";

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
      <h1 className="text-xl font-semibold text-slate-900">Olá, {estudante.nome.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Matrícula {estudante.matricula} · {estudante.turmaSerie ?? "Turma não informada"} ·{" "}
        {estudante.nomeEscola ?? estudante.escola.nome}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
          >
            <card.icon className="mb-3 h-6 w-6 text-brand-600" />
            <div className="font-semibold text-slate-900">{card.label}</div>
            <div className="mt-1 text-sm text-slate-500">{card.desc}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Dados do Responsável</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Responsável</dt>
            <dd className="text-slate-900">{estudante.nomeResponsavel ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Filiação 1</dt>
            <dd className="text-slate-900">{estudante.nomeFiliacao1 ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Filiação 2</dt>
            <dd className="text-slate-900">{estudante.nomeFiliacao2 ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">NIS</dt>
            <dd className="text-slate-900">{estudante.codigoNis ?? "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
