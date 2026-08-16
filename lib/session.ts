import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

/**
 * Módulo compatível com Edge Runtime (usado pelo middleware) e Node.js.
 * Não importa bcrypt nem next/headers — apenas assinatura/verificação de JWT.
 */

export const SESSION_COOKIE_NAME = "sme_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

export interface SessionPayload {
  userId: string;
  cpf: string;
  nome: string;
  role: Role;
  escolaId: number | null;
  servidorId: number | null;
  estudanteId: number | null;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function roleHomePath(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "SECRETARIA":
      return "/admin";
    case "DIRETOR":
      return "/portal/direcao";
    case "PROFESSOR":
      return "/portal/professor";
    case "SERVIDOR_GERAL":
      return "/portal/servidor";
    case "ALUNO":
      return "/portal/aluno";
  }
}

/** Prefixos de rota permitidos por papel, usados pelo middleware. */
export const ROLE_ALLOWED_PREFIXES: Record<Role, string[]> = {
  ADMIN: ["/admin"],
  SECRETARIA: ["/admin"],
  DIRETOR: ["/portal/direcao"],
  PROFESSOR: ["/portal/professor"],
  SERVIDOR_GERAL: ["/portal/servidor"],
  ALUNO: ["/portal/aluno"],
};
