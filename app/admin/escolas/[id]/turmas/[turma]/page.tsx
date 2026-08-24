import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TurmaDetalheView } from "@/components/portal/turma-detalhe";

interface PageProps {
  params: { id: string; turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminTurmaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();

  return (
    <TurmaDetalheView
      escolaId={escolaId}
      turma={turma}
      anoAtual={anoAtual}
      searchParams={searchParams}
      breadcrumb={
        <Link href={`/admin/escolas/${escolaId}`} className="text-primary hover:underline">
          ← {escola.nome}
        </Link>
      }
      alunoHref={(alunoId) => `/admin/estudantes/${alunoId}`}
      paginationBasePath={`/admin/escolas/${escolaId}/turmas/${params.turma}`}
    />
  );
}
