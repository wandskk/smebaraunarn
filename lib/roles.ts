import type { Role } from "@prisma/client";

/**
 * Baseado no vocabulário real de cargos observado na API Educ 21 (tabela
 * Cargo sincronizada): DIRETOR, VICE DIRETOR, COORDENADOR, COORDENADOR
 * GERAL, SUBCOORDENADOR — todos cobertos por "DIRETOR"/"COORDENA".
 * PROFESSOR TEMPORARIO, PROF PERM NIVEL - I..VI, PROFESSOR AUXILIAR,
 * PROFESSOR - CONVENIO — todos cobertos por "PROF" (abreviação comum nos
 * cargos reais; nenhum outro cargo do município contém essa substring).
 */
const DIRECAO_KEYWORDS = ["DIRETOR", "COORDENA"];
const DOCENTE_KEYWORDS = ["PROF", "DOCENTE"];

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
