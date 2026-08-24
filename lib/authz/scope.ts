import type { Role } from "@prisma/client";

/**
 * Representação central dos 5 scopes conceituais do master prompt. Função
 * pura (sem Prisma/I/O) para poder ser testada com node:test, seguindo o
 * mesmo princípio de lib/analytics/*.
 */
export type Scope =
  | { kind: "network" }
  | { kind: "school"; escolaId: number }
  | { kind: "professor"; escolaId: number; turmas: string[] }
  | { kind: "student-self"; estudanteId: number }
  | { kind: "staff-self"; servidorId: number };

export class ScopeError extends Error {}

interface ScopeSessionInput {
  role: Role;
  escolaId: number | null;
  servidorId: number | null;
  estudanteId: number | null;
}

interface ScopeFromSessionOptions {
  /**
   * Turmas do professor (código de turma, ex.: "EFAFM6A"), já carregadas
   * pela página/layout via ServidorTurma. Necessário para role PROFESSOR;
   * ignorado para os demais papéis.
   */
  professorTurmas?: string[];
}

/**
 * Constrói o Scope de autorização a partir da sessão. Não faz consulta ao
 * banco — quem chama já deve ter os dados necessários (a sessão já carrega
 * escolaId/servidorId/estudanteId; turmas do professor vêm de quem já
 * buscou o Servidor via lib/queries/portal.ts).
 *
 * Lança ScopeError quando o papel exige um vínculo que a sessão não tem
 * (ex.: DIRETOR sem escolaId) — isso reflete um estado de conta incompleta,
 * não uma tentativa de acesso indevido, e quem chama deve tratar como erro
 * de cadastro (ver app/portal/direcao/layout.tsx para o precedente de UX).
 */
export function scopeFromSession(session: ScopeSessionInput, options: ScopeFromSessionOptions = {}): Scope {
  switch (session.role) {
    case "ADMIN":
    case "SECRETARIA":
      return { kind: "network" };

    case "DIRETOR":
      if (session.escolaId == null) {
        throw new ScopeError("Diretor sem escola vinculada.");
      }
      return { kind: "school", escolaId: session.escolaId };

    case "PROFESSOR":
      if (session.escolaId == null) {
        throw new ScopeError("Professor sem escola vinculada.");
      }
      return { kind: "professor", escolaId: session.escolaId, turmas: options.professorTurmas ?? [] };

    case "ALUNO":
      if (session.estudanteId == null) {
        throw new ScopeError("Aluno sem estudante vinculado.");
      }
      return { kind: "student-self", estudanteId: session.estudanteId };

    case "SERVIDOR_GERAL":
      if (session.servidorId == null) {
        throw new ScopeError("Servidor sem registro funcional vinculado.");
      }
      return { kind: "staff-self", servidorId: session.servidorId };
  }
}
