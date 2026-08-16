import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

export async function getEstudanteBySession(session: SessionPayload) {
  if (!session.estudanteId) return null;
  return prisma.estudante.findUnique({
    where: { id: session.estudanteId },
    include: { escola: true },
  });
}

export async function getServidorBySession(session: SessionPayload) {
  if (!session.servidorId) return null;
  return prisma.servidor.findUnique({
    where: { id: session.servidorId },
    include: { escola: true },
  });
}
