import type { Scope } from "./scope";

/**
 * Predicados de autorização contextual por entidade. Puros (sem Prisma/I/O)
 * — quem chama passa só os campos necessários da entidade já carregada.
 * Devem ser a única fonte de verdade para "este scope pode ver esta
 * entidade?", reutilizável tanto no servidor (antes de renderizar) quanto,
 * futuramente, para alimentar CapabilityGate na UI.
 */

export function canViewEscola(scope: Scope, escolaId: number): boolean {
  switch (scope.kind) {
    case "network":
      return true;
    case "school":
    case "professor":
      return scope.escolaId === escolaId;
    case "student-self":
    case "staff-self":
      return false;
  }
}

export function canViewTurma(scope: Scope, turma: { escolaId: number; turma: string }): boolean {
  switch (scope.kind) {
    case "network":
      return true;
    case "school":
      return scope.escolaId === turma.escolaId;
    case "professor":
      return scope.escolaId === turma.escolaId && scope.turmas.includes(turma.turma);
    case "student-self":
    case "staff-self":
      return false;
  }
}

export function canViewEstudante(
  scope: Scope,
  estudante: { id: number; escolaId: number; turmaSerie: string | null },
): boolean {
  switch (scope.kind) {
    case "network":
      return true;
    case "school":
      return scope.escolaId === estudante.escolaId;
    case "professor":
      return (
        scope.escolaId === estudante.escolaId &&
        estudante.turmaSerie !== null &&
        scope.turmas.includes(estudante.turmaSerie)
      );
    case "student-self":
      return scope.estudanteId === estudante.id;
    case "staff-self":
      // Servidor Geral não recebe dados acadêmicos de estudantes por
      // padrão, mesmo estando lotado na mesma escola (regra 7.7 do master
      // prompt: não expor dados acadêmicos a SERVIDOR_GERAL apenas por
      // lotação escolar).
      return false;
  }
}

export function canViewServidor(scope: Scope, servidor: { id: number; escolaId: number | null }): boolean {
  switch (scope.kind) {
    case "network":
      return true;
    case "school":
      return servidor.escolaId !== null && scope.escolaId === servidor.escolaId;
    case "staff-self":
      return scope.servidorId === servidor.id;
    case "professor":
    case "student-self":
      return false;
  }
}
