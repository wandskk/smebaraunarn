"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { z } from "zod";

export interface FormState {
  error: string | null;
}

const indicadoresSchema = z.object({
  totalEscolas: z.coerce.number().int().min(0),
  totalAlunos: z.coerce.number().int().min(0),
  totalDocumentos: z.coerce.number().int().min(0),
  totalAcessos: z.coerce.number().int().min(0),
});

export async function updateIndicadoresAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const parsed = indicadoresSchema.safeParse({
    totalEscolas: formData.get("totalEscolas"),
    totalAlunos: formData.get("totalAlunos"),
    totalDocumentos: formData.get("totalDocumentos"),
    totalAcessos: formData.get("totalAcessos"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.indicadoresLanding.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/admin/indicadores/portal-publico");
  revalidatePath("/");
  return { error: null };
}
