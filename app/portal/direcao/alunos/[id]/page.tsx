import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getAlunoDetalheCompleto } from "@/lib/queries/academico";
import { scopeFromSession } from "@/lib/authz/scope";
import { canViewEstudante } from "@/lib/authz/authorize";
import { AlunoDetalhe } from "@/components/portal/aluno-detalhe";

interface PageProps {
  params: { id: string };
}

export default async function DirecaoAlunoDetalhePage({ params }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const scope = scopeFromSession(session);
  const anoAtual = new Date().getFullYear();
  const dados = await getAlunoDetalheCompleto(Number(params.id), anoAtual);

  // Escopo travado: direção só pode ver alunos da própria escola.
  if (!dados || !canViewEstudante(scope, dados.estudante)) notFound();

  return (
    <div>
      <Link
        href={`/portal/direcao/turmas/${encodeURIComponent(dados.estudante.turmaSerie ?? "")}`}
        className="text-sm text-primary hover:underline"
      >
        ← {dados.estudante.turmaSerie ?? "Turmas"}
      </Link>
      <div className="mt-2">
        <AlunoDetalhe dados={dados} ano={anoAtual} />
      </div>
    </div>
  );
}
