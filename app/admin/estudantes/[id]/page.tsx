import { notFound } from "next/navigation";
import Link from "next/link";
import { getAlunoDetalheCompleto } from "@/lib/queries/academico";
import { AlunoDetalhe } from "@/components/portal/aluno-detalhe";

interface PageProps {
  params: { id: string };
}

export default async function AdminAlunoDetalhePage({ params }: PageProps) {
  const anoAtual = new Date().getFullYear();
  const dados = await getAlunoDetalheCompleto(Number(params.id), anoAtual);
  if (!dados) notFound();

  return (
    <div>
      <Link href="/admin/estudantes" className="text-sm text-primary hover:underline">
        ← Estudantes
      </Link>
      <div className="mt-2">
        <AlunoDetalhe dados={dados} ano={anoAtual} />
      </div>
    </div>
  );
}
