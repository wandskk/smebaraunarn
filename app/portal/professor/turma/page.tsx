import { redirect } from "next/navigation";

/**
 * Rota legada — "Minhas Turmas" passou a ser uma lista de turmas de verdade
 * em `/portal/professor/turmas` (ETAPA 06), não mais uma lista de alunos de
 * todas as turmas misturadas. Mantido como redirect para não quebrar
 * links/bookmarks já compartilhados.
 */
export default function ProfessorTurmaLegadoRedirect() {
  redirect("/portal/professor/turmas");
}
