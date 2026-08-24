import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { scopeFromSession } from "@/lib/authz/scope";
import { canViewTurma } from "@/lib/authz/authorize";
import { TurmaDetalheView } from "@/components/portal/turma-detalhe";

interface PageProps {
  params: { turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function ProfessorTurmaDetalhePage({ params, searchParams }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const turma = decodeURIComponent(params.turma);
  const scope = scopeFromSession(session, {
    professorAtribuicoes: servidor.turmas.map((t) => ({ escolaId: t.escolaId, turma: t.turma })),
  });

  // A escola desta turma vem da própria atribuição (ServidorTurma.escolaId),
  // não de servidor.escolaId — um professor pode ter turmas em mais de uma
  // escola (ETAPA 06). Turma fora da atribuição real do professor (inclusive
  // por URL direta) retorna 404, mesmo que o código colida com uma turma de
  // outra escola onde ele também leciona.
  const atribuicao = servidor.turmas.find((t) => t.turma === turma);
  if (!atribuicao || !canViewTurma(scope, { escolaId: atribuicao.escolaId, turma })) notFound();

  const anoAtual = new Date().getFullYear();

  return (
    <TurmaDetalheView
      escolaId={atribuicao.escolaId}
      turma={turma}
      anoAtual={anoAtual}
      searchParams={searchParams}
      breadcrumb={
        <Link href="/portal/professor/turmas" className="text-primary hover:underline">
          ← Minhas Turmas
        </Link>
      }
      alunoHref={(alunoId) => `/portal/professor/estudantes/${alunoId}`}
      paginationBasePath={`/portal/professor/turmas/${params.turma}`}
    />
  );
}
