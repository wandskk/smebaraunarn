"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { hashPassword } from "@/lib/auth";
import { normalizeCpf } from "@/lib/utils";
import { createUserSchema } from "@/lib/validations/user";

export interface FormState {
  error: string | null;
}

export async function createUserAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireSession(["ADMIN"]);

  const parsed = createUserSchema.safeParse({
    cpf: formData.get("cpf"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    role: formData.get("role"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cpf = normalizeCpf(parsed.data.cpf);
  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) {
    return { error: "Já existe um acesso cadastrado para este CPF." };
  }

  const passwordHash = await hashPassword(parsed.data.senha);

  await prisma.user.create({
    data: {
      cpf,
      nome: parsed.data.nome,
      email: parsed.data.email || null,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/admin/usuarios");
  return { error: null };
}

export async function toggleUserAtivoAction(userId: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { ativo } });
  revalidatePath("/admin/usuarios");
}
