import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { getAlunoDetalheCompleto } from "@/lib/queries/academico";
import { scopeFromSession } from "@/lib/authz/scope";
import { canViewEstudante } from "@/lib/authz/authorize";
import { AlunoDetalhe } from "@/components/portal/aluno-detalhe";

interface PageProps {
  params: { id: string };
}

export default async function ProfessorAlunoDetalhePage({ params }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  // Escopo travado: professor só pode ver alunos da própria escola e de
  // alguma das suas turmas. Sem turma vinculada, nenhum aluno fica visível —
  // evita liberar a escola inteira quando o servidor ainda não tem
  // ServidorTurma sincronizado.
  const scope = scopeFromSession(session, { professorTurmas: servidor.turmas.map((t) => t.turma) });
  const anoAtual = new Date().getFullYear();
  const dados = await getAlunoDetalheCompleto(Number(params.id), anoAtual);

  if (!dados || !canViewEstudante(scope, dados.estudante)) notFound();

  return (
    <div>
      <Link href="/portal/professor/turma" className="text-sm text-primary hover:underline">
        ← Minhas Turmas
      </Link>
      <div className="mt-2">
        <AlunoDetalhe dados={dados} ano={anoAtual} />
      </div>
    </div>
  );
}
