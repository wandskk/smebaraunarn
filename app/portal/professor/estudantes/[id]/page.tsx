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

export default async function ProfessorEstudanteDetalhePage({ params }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  // Escopo travado: professor só pode ver alunos da própria escola e de
  // alguma das suas turmas. Sem turma vinculada, nenhum aluno fica visível —
  // evita liberar a escola inteira quando o servidor ainda não tem
  // ServidorTurma sincronizado.
  const scope = scopeFromSession(session, {
    professorAtribuicoes: servidor.turmas.map((t) => ({ escolaId: t.escolaId, turma: t.turma })),
  });
  const anoAtual = new Date().getFullYear();
  const dados = await getAlunoDetalheCompleto(Number(params.id), anoAtual);

  if (!dados || !canViewEstudante(scope, dados.estudante)) notFound();

  // Notas: por padrão, só a(s) disciplina(s) do professor NESTA turma —
  // achado P0 do documento de Professor (não assumir boletim completo para
  // qualquer professor). Sem disciplina informada no ServidorTurma (dado
  // ainda não sincronizado), não filtra — melhor mostrar tudo do que
  // esconder por um dado ausente que não é uma decisão de política.
  const disciplinasNaTurma = servidor.turmas
    .filter((t) => t.escolaId === dados.estudante.escolaId && t.turma === dados.estudante.turmaSerie)
    .map((t) => t.disciplina)
    .filter((d): d is string => Boolean(d));
  const disciplinasVisiveis = disciplinasNaTurma.length > 0 ? disciplinasNaTurma : undefined;

  return (
    <div>
      <Link href="/portal/professor/turmas" className="text-sm text-primary hover:underline">
        ← Minhas Turmas
      </Link>
      <div className="mt-2">
        <AlunoDetalhe dados={dados} ano={anoAtual} disciplinasVisiveis={disciplinasVisiveis} />
      </div>
    </div>
  );
}
