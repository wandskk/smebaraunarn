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

/**
 * Explica em texto por que `classifyServidorRole` chegou naquele papel —
 * cita a palavra-chave encontrada em cargo/função, para permitir auditoria
 * (achado do DOCX de Admin: "explicar a classificação de papel
 * ('Professor porque cargo contém PROF…')").
 */
export function explicarClassificacaoServidorRole(cargo?: string | null, funcao?: string | null): string {
  const haystack = `${cargo ?? ""} ${funcao ?? ""}`.toUpperCase();
  const role = classifyServidorRole(cargo, funcao);

  if (role === "DIRETOR") {
    const keyword = DIRECAO_KEYWORDS.find((k) => haystack.includes(k));
    return `Direção porque cargo/função contém "${keyword}".`;
  }
  if (role === "PROFESSOR") {
    const keyword = DOCENTE_KEYWORDS.find((k) => haystack.includes(k));
    return `Professor(a) porque cargo/função contém "${keyword}".`;
  }
  return "Servidor Geral — nenhuma palavra-chave de Direção ou Professor encontrada em cargo/função (papel de fallback).";
}
