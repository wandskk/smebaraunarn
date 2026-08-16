"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function updateServidorEscolaAction(servidorId: number, escolaId: number | null) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.servidor.update({ where: { id: servidorId }, data: { escolaId } });
  revalidatePath("/admin/servidores");
}
