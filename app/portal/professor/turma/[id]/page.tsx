import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { getAlunoDetalheCompleto } from "@/lib/queries/academico";
import { AlunoDetalhe } from "@/components/portal/aluno-detalhe";

interface PageProps {
  params: { id: string };
}

export default async function ProfessorAlunoDetalhePage({ params }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const anoAtual = new Date().getFullYear();
  const dados = await getAlunoDetalheCompleto(Number(params.id), anoAtual);

  // Escopo travado: professor só pode ver alunos da própria escola e de
  // alguma das suas turmas (mesma regra de filtro usada em turma/page.tsx).
  // Sem turma vinculada, nenhum aluno fica visível — evita liberar a escola
  // inteira quando o servidor ainda não tem ServidorTurma sincronizado.
  const nomesTurma = servidor.turmas.map((t) => t.turma);
  const turmaPermitida = nomesTurma.includes(dados?.estudante.turmaSerie ?? "");
  if (!dados || dados.estudante.escolaId !== servidor.escolaId || !turmaPermitida) notFound();

  return (
    <div>
      <Link href="/portal/professor/turma" className="text-sm text-brand-700 hover:underline">
        ← Minhas Turmas
      </Link>
      <div className="mt-2">
        <AlunoDetalhe dados={dados} ano={anoAtual} />
      </div>
    </div>
  );
}
