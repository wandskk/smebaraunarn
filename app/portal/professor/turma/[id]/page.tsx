import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

/**
 * Rota legada — o parâmetro `[id]` sempre foi um estudante, não uma turma
 * (achado P0 do documento de Professor: nomenclatura enganosa). A ficha do
 * estudante passou a viver em `/portal/professor/estudantes/[id]` (ETAPA 06).
 * Mantido como redirect para não quebrar links/bookmarks já compartilhados.
 */
export default function ProfessorAlunoLegadoRedirect({ params }: PageProps) {
  redirect(`/portal/professor/estudantes/${params.id}`);
}
