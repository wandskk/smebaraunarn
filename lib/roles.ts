import type { Role } from "@prisma/client";

const DIRECAO_KEYWORDS = ["DIRETOR", "VICE-DIRETOR", "VICE DIRETOR", "COORDENA"];
const DOCENTE_KEYWORDS = ["PROFESSOR", "DOCENTE"];

/**
 * Classifica o papel (Role) de um servidor a partir do cargo/função retornados
 * pela API do SIGEduc.
 */
export function classifyServidorRole(cargo?: string | null, funcao?: string | null): Role {
  const haystack = `${cargo ?? ""} ${funcao ?? ""}`.toUpperCase();

  if (DIRECAO_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "DIRETOR";
  }
  if (DOCENTE_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "PROFESSOR";
  }
  return "SERVIDOR_GERAL";
}
