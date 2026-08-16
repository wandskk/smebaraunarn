import "server-only";

import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Garante que exista uma sessão válida com um dos papéis informados.
 * Usado nos layouts de /admin e /portal/* como segunda camada de defesa,
 * complementar ao middleware.
 */
export async function requireSession(allowedRoles: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !allowedRoles.includes(session.role)) {
    redirect("/login");
  }
  return session;
}
