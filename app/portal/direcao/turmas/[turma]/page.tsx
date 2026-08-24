import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { TurmaDetalheView } from "@/components/portal/turma-detalhe";

interface PageProps {
  params: { turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoTurmaDetalhePage({ params, searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();

  return (
    <TurmaDetalheView
      escolaId={session.escolaId!}
      turma={turma}
      anoAtual={anoAtual}
      searchParams={searchParams}
      breadcrumb={
        <Link href="/portal/direcao/turmas" className="text-primary hover:underline">
          ← Turmas
        </Link>
      }
      alunoHref={(alunoId) => `/portal/direcao/alunos/${alunoId}`}
      paginationBasePath={`/portal/direcao/turmas/${params.turma}`}
    />
  );
}
