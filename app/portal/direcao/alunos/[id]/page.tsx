import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

/**
 * Rota legada — a ficha do estudante da Direção passou a viver em
 * `/portal/direcao/estudantes/[id]` (ETAPA 05, consistência de nomenclatura
 * com Admin/Aluno). Mantido como redirect para não quebrar links/bookmarks
 * já compartilhados.
 */
export default function DirecaoAlunoLegadoRedirect({ params }: PageProps) {
  redirect(`/portal/direcao/estudantes/${params.id}`);
}
